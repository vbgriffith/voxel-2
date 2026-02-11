/**
 * Enemy.js - Enemy with rigged character and animations
 */
class Enemy {
    constructor(engine, type, position) {
        this.engine = engine;
        this.scene = engine.scene;
        this.type = type;
        
        // Character rig
        this.rig = null;
        this.animator = null;
        
        // Get type stats
        const stats = this.getTypeStats(type);
        this.health = stats.health;
        this.maxHealth = stats.health;
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.attackRange = stats.attackRange;
        this.attackRate = stats.attackRate;
        
        this.position = position.clone();
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.rotation = 0;
        
        this.attackCooldown = 0;
        this.active = true;
        this.radius = 0.5;
        this.pushable = true;
        
        // AI state
        this.state = 'idle';
        this.isMoving = false;
        this.isAttacking = false;
        
        this.createCharacter();
        
        const collision = engine.getSystem('collision');
        if (collision) collision.register(this, 'enemies');
    }
    
    getTypeStats(type) {
        const types = {
            'grunt': { health: 50, damage: 10, speed: 0.08, attackRange: 2, attackRate: 60 },
            'fast': { health: 30, damage: 15, speed: 0.15, attackRange: 1.5, attackRate: 40 },
            'tank': { health: 120, damage: 20, speed: 0.05, attackRange: 2.5, attackRate: 90 },
            'ranged': { health: 40, damage: 12, speed: 0.06, attackRange: 10, attackRate: 120 }
        };
        return types[type] || types['grunt'];
    }
    
    createCharacter() {
        this.rig = new CharacterRig(this.engine, `enemy_${this.type}`);
        this.rig.setPosition(this.position.x, this.position.y, this.position.z);
        
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            this.animator = animSystem.createAnimator(this, this.rig.getSkeleton());
        }
        
        this.mesh = this.rig.getRootNode();
    }
    
    update(deltaTime, playerPos) {
        if (!this.active) return;
        
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        this.rotation = Math.atan2(dx, dz);
        this.rig.setRotation(0, this.rotation, 0);
        
        // Move or attack
        if (dist > this.attackRange && !this.isAttacking) {
            const moveX = (dx / dist) * this.speed;
            const moveZ = (dz / dist) * this.speed;
            
            this.velocity.x = moveX;
            this.velocity.z = moveZ;
            
            this.position.x += moveX;
            this.position.z += moveZ;
            this.rig.setPosition(this.position.x, this.position.y, this.position.z);
            
            this.isMoving = true;
        } else {
            this.velocity.set(0, 0, 0);
            this.isMoving = false;
        }
        
        // Update animation
        const animSystem = this.engine.getSystem('animation');
        if (animSystem && !this.isAttacking) {
            animSystem.setMovementState(this, this.velocity);
        }
        
        // Attack
        this.attackCooldown--;
        if (dist <= this.attackRange && this.attackCooldown <= 0) {
            this.attackCooldown = this.attackRate;
            this.performAttack();
        }
    }
    
    performAttack() {
        this.isAttacking = true;
        
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            animSystem.playAttack(this);
        }
        
        setTimeout(() => {
            this.isAttacking = false;
            this.engine.emit('enemy:attack', {
                enemy: this,
                damage: this.damage,
                type: this.type
            });
        }, 300);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            animSystem.playHit(this);
        }
        
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createBloodSplatter(this.position.clone(), 0.6);
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.active = false;
        
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createBloodSplatter(this.position.clone(), 1.5);
        }
        
        if (this.rig) {
            setTimeout(() => this.rig.dispose(), 2000);
        }
        
        const collision = this.engine.getSystem('collision');
        if (collision) collision.unregister(this, 'enemies');
        
        this.engine.emit('enemy:death', { enemy: this });
    }
}
