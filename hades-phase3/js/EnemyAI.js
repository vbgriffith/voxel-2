/**
 * EnemyAI.js - Full AI state machine
 * States: IDLE → PATROL → CHASE → ATTACK → RETREAT → REGROUP
 * Includes swarm logic, retreat, flanking, ranged behaviors
 */

const AIState = {
    IDLE:     'idle',
    PATROL:   'patrol',
    ALERT:    'alert',       // Heard/saw something - looking around
    CHASE:    'chase',
    ATTACK:   'attack',
    RETREAT:  'retreat',
    REGROUP:  'regroup',
    DEAD:     'dead'
};

const AIConfig = {
    grunt: {
        detectionRadius:   12,
        attackRange:        2.2,
        attackCooldown:    60,
        damage:            10,
        speed:             0.09,
        runSpeed:          0.14,
        retreatHealthPct:  0.20,   // retreat below 20% HP
        retreatDistance:    8,
        regroupRadius:      4,
        patrolRadius:       6,
        swarmWeight:        1.0,
        flankWeight:        0.5,
        separationRadius:   1.5,
        aggroOnAllyHit:    true,
    },
    fast: {
        detectionRadius:   16,
        attackRange:        1.8,
        attackCooldown:    35,
        damage:            14,
        speed:             0.17,
        runSpeed:          0.26,
        retreatHealthPct:  0.10,
        retreatDistance:   10,
        regroupRadius:      3,
        patrolRadius:       8,
        swarmWeight:        0.8,
        flankWeight:        1.2,   // fast enemies try to flank
        separationRadius:   1.2,
        aggroOnAllyHit:    true,
    },
    tank: {
        detectionRadius:   10,
        attackRange:        2.6,
        attackCooldown:    90,
        damage:            22,
        speed:             0.055,
        runSpeed:          0.08,
        retreatHealthPct:  0.0,    // tanks NEVER retreat
        retreatDistance:    0,
        regroupRadius:      5,
        patrolRadius:       4,
        swarmWeight:        1.2,
        flankWeight:        0.2,
        separationRadius:   2.0,
        aggroOnAllyHit:    false,
    },
    ranged: {
        detectionRadius:   20,
        attackRange:       11,
        minAttackRange:     5,     // stays away from player
        attackCooldown:   110,
        damage:            12,
        speed:             0.07,
        runSpeed:          0.12,
        retreatHealthPct:  0.35,   // ranged retreat early
        retreatDistance:   12,
        regroupRadius:      6,
        patrolRadius:       7,
        swarmWeight:        0.3,
        flankWeight:        0.8,
        separationRadius:   2.5,
        aggroOnAllyHit:    true,
        isRanged:          true,
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Single Enemy Brain
// ─────────────────────────────────────────────────────────────────────────────
class EnemyBrain {
    constructor(enemy, swarmManager) {
        this.enemy        = enemy;
        this.swarm        = swarmManager;
        this.cfg          = AIConfig[enemy.type] || AIConfig.grunt;

        this.state        = AIState.IDLE;
        this.prevState    = null;
        this.stateTimer   = 0;          // frames in current state
        this.alertTimer   = 0;
        this.attackTimer  = 0;
        this.retreatTimer = 0;

        // Patrol waypoints
        this.patrolOrigin  = enemy.position.clone();
        this.patrolTarget  = null;
        this.patrolWaiting = false;
        this.patrolWaitTimer = 0;

        // Steering
        this.desiredVelocity = new BABYLON.Vector3(0,0,0);
        this.currentVelocity = new BABYLON.Vector3(0,0,0);

        // Memory
        this.lastKnownPlayerPos = null;
        this.timeSincePlayerSeen = 0;
        this.alertedByAlly = false;
    }

    // ── Main tick ──────────────────────────────────────────────────────────
    update(dt, playerPos, allies) {
        if (this.enemy.health <= 0) { this.setState(AIState.DEAD); return; }

        this.stateTimer++;
        this.attackTimer = Math.max(0, this.attackTimer - 1);

        const distToPlayer  = this.distTo(playerPos);
        const canSeePlayer  = distToPlayer <= this.cfg.detectionRadius;
        const healthPct     = this.enemy.health / this.enemy.maxHealth;

        if (canSeePlayer) {
            this.lastKnownPlayerPos  = playerPos.clone();
            this.timeSincePlayerSeen = 0;
        } else {
            this.timeSincePlayerSeen++;
        }

        switch (this.state) {
            case AIState.IDLE:    this.tickIdle(canSeePlayer, distToPlayer, healthPct);    break;
            case AIState.PATROL:  this.tickPatrol(canSeePlayer, distToPlayer, healthPct); break;
            case AIState.ALERT:   this.tickAlert(canSeePlayer, distToPlayer);             break;
            case AIState.CHASE:   this.tickChase(canSeePlayer, distToPlayer, healthPct, playerPos, allies); break;
            case AIState.ATTACK:  this.tickAttack(distToPlayer, healthPct, playerPos);   break;
            case AIState.RETREAT: this.tickRetreat(distToPlayer, playerPos, allies);      break;
            case AIState.REGROUP: this.tickRegroup(distToPlayer, allies);                 break;
        }

        // Apply steering
        this.applyVelocity(dt, allies);
    }

    // ── State: IDLE ────────────────────────────────────────────────────────
    tickIdle(canSee, dist, hp) {
        // Start patrolling after a short rest
        if (this.stateTimer > 120) {
            this.setState(AIState.PATROL);
            return;
        }
        if (canSee || this.alertedByAlly) {
            this.setState(AIState.CHASE);
        }
    }

    // ── State: PATROL ──────────────────────────────────────────────────────
    tickPatrol(canSee, dist, hp) {
        if (canSee || this.alertedByAlly) {
            this.setState(AIState.CHASE);
            return;
        }

        if (this.patrolWaiting) {
            this.patrolWaitTimer--;
            this.desiredVelocity.setAll(0);
            if (this.patrolWaitTimer <= 0) {
                this.patrolWaiting = false;
                this.patrolTarget  = this.randomPatrolPoint();
            }
            return;
        }

        // Generate first target
        if (!this.patrolTarget) {
            this.patrolTarget = this.randomPatrolPoint();
        }

        const dtTarget = this.distToVec(this.patrolTarget);
        if (dtTarget < 1.2) {
            // Reached waypoint — wait briefly then pick new one
            this.patrolWaiting    = true;
            this.patrolWaitTimer  = 60 + Math.random() * 60;
            this.desiredVelocity.setAll(0);
        } else {
            this.steerToward(this.patrolTarget, this.cfg.speed * 0.7);
        }
    }

    // ── State: ALERT ───────────────────────────────────────────────────────
    tickAlert(canSee, dist) {
        this.alertTimer--;
        if (this.alertTimer <= 0 || canSee) {
            this.setState(canSee ? AIState.CHASE : AIState.PATROL);
        }
        this.desiredVelocity.setAll(0); // Stand still, "looking around"
    }

    // ── State: CHASE ───────────────────────────────────────────────────────
    tickChase(canSee, dist, hp, playerPos, allies) {
        // Check retreat condition
        if (hp <= this.cfg.retreatHealthPct && this.cfg.retreatHealthPct > 0) {
            this.setState(AIState.RETREAT);
            return;
        }

        // Lost player?
        if (!canSee && this.timeSincePlayerSeen > 180) {
            this.setState(AIState.ALERT);
            this.alertTimer = 120;
            return;
        }

        const target = this.lastKnownPlayerPos || playerPos;

        // Within attack range?
        if (dist <= this.cfg.attackRange) {
            this.setState(AIState.ATTACK);
            return;
        }

        // Ranged enemy: keep ideal distance
        if (this.cfg.isRanged && dist < this.cfg.minAttackRange) {
            this.steerAwayFrom(target, this.cfg.runSpeed);
            return;
        }

        // Swarm steering: combine direct pursuit + separation + flanking
        const chase   = this.vecTo(target).normalize().scale(this.cfg.swarmWeight);
        const sep     = this.separationForce(allies);
        const flank   = this.flankForce(target, allies);
        const speed   = this.cfg.runSpeed;

        this.desiredVelocity = chase.add(sep.scale(1.2)).add(flank.scale(this.cfg.flankWeight));
        if (this.desiredVelocity.length() > 0.001) {
            this.desiredVelocity.normalize().scaleInPlace(speed);
        }
    }

    // ── State: ATTACK ──────────────────────────────────────────────────────
    tickAttack(dist, hp, playerPos) {
        // Check retreat
        if (hp <= this.cfg.retreatHealthPct && this.cfg.retreatHealthPct > 0) {
            this.setState(AIState.RETREAT);
            return;
        }

        // Player stepped out of range
        if (dist > this.cfg.attackRange * 1.3) {
            this.setState(AIState.CHASE);
            return;
        }

        this.desiredVelocity.setAll(0); // Stand still while attacking

        if (this.attackTimer <= 0) {
            this.performAttack(playerPos, dist);
            this.attackTimer = this.cfg.attackCooldown;
        }
    }

    // ── State: RETREAT ─────────────────────────────────────────────────────
    tickRetreat(dist, playerPos, allies) {
        this.retreatTimer++;

        // Flee directly away from player
        this.steerAwayFrom(playerPos, this.cfg.runSpeed * 1.1);

        // Find a nearby ally to regroup with
        const nearAlly = this.findNearestAlly(allies, this.cfg.regroupRadius * 3);
        if (nearAlly || this.retreatTimer > 180) {
            this.setState(AIState.REGROUP);
        }
    }

    // ── State: REGROUP ─────────────────────────────────────────────────────
    tickRegroup(dist, allies) {
        const nearAlly = this.findNearestAlly(allies, this.cfg.regroupRadius * 2);
        if (nearAlly) {
            const dtAlly = this.distToVec(nearAlly.position);
            if (dtAlly > this.cfg.regroupRadius) {
                this.steerToward(nearAlly.position, this.cfg.speed);
            } else {
                this.desiredVelocity.setAll(0);
                // Recovered — re-enter chase if player is close
                if (dist < this.cfg.detectionRadius) {
                    // Only re-engage if health > 30%
                    if (this.enemy.health / this.enemy.maxHealth > 0.3) {
                        this.setState(AIState.CHASE);
                    }
                }
            }
        } else {
            // No allies nearby — just wait
            this.desiredVelocity.setAll(0);
            if (dist < this.cfg.detectionRadius * 0.7) {
                this.setState(AIState.CHASE);
            }
        }
    }

    // ── Attack execution ───────────────────────────────────────────────────
    performAttack(playerPos, dist) {
        this.enemy.engine.emit('enemy:attack', {
            enemy:  this.enemy,
            damage: this.cfg.damage,
            type:   this.enemy.type,
            position: this.enemy.position.clone()
        });

        const animSys = this.enemy.engine.getSystem('animation');
        if (animSys) animSys.playAttack(this.enemy);

        // Ranged enemy fires a projectile
        if (this.cfg.isRanged && playerPos) {
            this.fireProjectile(playerPos);
        }
    }

    fireProjectile(targetPos) {
        const dir   = targetPos.subtract(this.enemy.position).normalize();
        const angle = Math.atan2(dir.x, dir.z);

        // Emit so GameController adds it to its projectile list
        this.enemy.engine.emit('enemy:projectile', {
            position:  this.enemy.position.clone().add(new BABYLON.Vector3(0, 1.5, 0)),
            damage:    this.cfg.damage,
            rotation:  angle,
            speed:     0.45,
            lifetime:  140,
            radius:    0.2,
            color:     new BABYLON.Color3(0.3, 1, 0.3),
            team:      'enemy'
        });
    }

    // ── Steering helpers ───────────────────────────────────────────────────
    steerToward(target, speed) {
        const dir = this.vecTo(target);
        const len = dir.length();
        if (len < 0.001) return;
        this.desiredVelocity = dir.normalize().scale(speed);
    }

    steerAwayFrom(target, speed) {
        const dir = this.enemy.position.subtract(target);
        const len = dir.length();
        if (len < 0.001) return;
        this.desiredVelocity = dir.normalize().scale(speed);
    }

    separationForce(allies) {
        const force = BABYLON.Vector3.Zero();
        let count = 0;
        for (const ally of allies) {
            if (ally === this.enemy || !ally.active) continue;
            const diff = this.enemy.position.subtract(ally.position);
            const d = diff.length();
            if (d < this.cfg.separationRadius && d > 0.001) {
                force.addInPlace(diff.normalize().scale((this.cfg.separationRadius - d) / this.cfg.separationRadius));
                count++;
            }
        }
        if (count > 0) force.scaleInPlace(1 / count);
        return force;
    }

    flankForce(targetPos, allies) {
        // Try to approach from a different angle than most allies
        const myAngle = Math.atan2(
            this.enemy.position.z - targetPos.z,
            this.enemy.position.x - targetPos.x
        );
        // Find average angle of allies
        let avgAngle = 0, c = 0;
        for (const a of allies) {
            if (a === this.enemy || !a.active) continue;
            avgAngle += Math.atan2(a.position.z - targetPos.z, a.position.x - targetPos.x);
            c++;
        }
        if (c === 0) return BABYLON.Vector3.Zero();
        avgAngle /= c;
        // Push perpendicular to average angle
        const perpAngle = avgAngle + Math.PI / 2;
        return new BABYLON.Vector3(Math.cos(perpAngle), 0, Math.sin(perpAngle));
    }

    applyVelocity(dt, allies) {
        // Smooth velocity
        this.currentVelocity = BABYLON.Vector3.Lerp(
            this.currentVelocity,
            this.desiredVelocity,
            0.18
        );

        if (this.currentVelocity.length() < 0.001) {
            this.enemy.velocity.setAll(0);
            return;
        }

        this.enemy.position.addInPlace(this.currentVelocity);

        // Arena clamping
        this.enemy.position.x = Math.max(-18, Math.min(18, this.enemy.position.x));
        this.enemy.position.z = Math.max(-18, Math.min(18, this.enemy.position.z));

        // Sync rig
        if (this.enemy.rig) {
            this.enemy.rig.setPosition(
                this.enemy.position.x,
                this.enemy.position.y,
                this.enemy.position.z
            );
            const angle = Math.atan2(this.currentVelocity.x, this.currentVelocity.z);
            this.enemy.rig.setRotation(0, angle, 0);
        }

        this.enemy.velocity.copyFrom(this.currentVelocity);

        // Drive animation
        const animSys = this.enemy.engine.getSystem('animation');
        if (animSys && this.state !== AIState.ATTACK) {
            animSys.setMovementState(this.enemy, this.currentVelocity);
        }
    }

    // ── Utilities ──────────────────────────────────────────────────────────
    setState(s) {
        if (s === this.state) return;
        this.prevState  = this.state;
        this.state      = s;
        this.stateTimer = 0;

        // Broadcast alert to nearby allies when entering CHASE
        if (s === AIState.CHASE) {
            this.swarm && this.swarm.broadcastAlert(this.enemy, this.lastKnownPlayerPos);
        }

        const animSys = this.enemy.engine.getSystem('animation');
        if (animSys) {
            if (s === AIState.IDLE || s === AIState.PATROL || s === AIState.REGROUP) {
                animSys.setMovementState(this.enemy, BABYLON.Vector3.Zero());
            }
        }
    }

    receiveAlert(sourceEnemy, knownPos) {
        if (this.state === AIState.IDLE || this.state === AIState.PATROL) {
            this.alertedByAlly       = true;
            this.lastKnownPlayerPos  = knownPos.clone();
            this.setState(AIState.ALERT);
            this.alertTimer = 80;
        }
    }

    distTo(pos) {
        return BABYLON.Vector3.Distance(this.enemy.position, pos);
    }

    distToVec(v) {
        return BABYLON.Vector3.Distance(this.enemy.position, v);
    }

    vecTo(target) {
        return target.subtract(this.enemy.position);
    }

    randomPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const r     = this.cfg.patrolRadius * (0.4 + Math.random() * 0.6);
        return this.patrolOrigin.clone().add(new BABYLON.Vector3(
            Math.cos(angle) * r, 0, Math.sin(angle) * r
        ));
    }

    findNearestAlly(allies, maxDist) {
        let best = null, bestD = Infinity;
        for (const a of allies) {
            if (a === this.enemy || !a.active) continue;
            const d = BABYLON.Vector3.Distance(this.enemy.position, a.position);
            if (d < maxDist && d < bestD) { bestD = d; best = a; }
        }
        return best;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Swarm Manager — coordinates a group of enemies
// ─────────────────────────────────────────────────────────────────────────────
class SwarmManager {
    constructor(engine) {
        this.engine   = engine;
        this.enemies  = [];   // living enemies in scene
        this.brains   = new Map();   // enemy → EnemyBrain

        engine.on('enemy:registered',  (d) => this.onEnemyAdded(d.enemy));
        engine.on('enemy:death',       (d) => this.onEnemyDeath(d.enemy));
        engine.registerSystem('swarm', this);

        console.log('[SwarmManager] Initialized');
    }

    onEnemyAdded(enemy) {
        const brain = new EnemyBrain(enemy, this);
        this.brains.set(enemy, brain);
        this.enemies.push(enemy);
        enemy.brain = brain;
    }

    onEnemyDeath(enemy) {
        this.brains.delete(enemy);
        const i = this.enemies.indexOf(enemy);
        if (i > -1) this.enemies.splice(i, 1);
    }

    broadcastAlert(source, knownPos) {
        const alertRadius = 12;
        for (const [enemy, brain] of this.brains) {
            if (enemy === source || !enemy.active) continue;
            const d = BABYLON.Vector3.Distance(source.position, enemy.position);
            if (d <= alertRadius) {
                brain.receiveAlert(source, knownPos);
            }
        }
    }

    update(dt, playerPos) {
        for (const [enemy, brain] of this.brains) {
            if (!enemy.active) continue;
            brain.update(dt, playerPos, this.enemies);
        }
    }

    clear() {
        this.enemies = [];
        this.brains.clear();
    }
}
