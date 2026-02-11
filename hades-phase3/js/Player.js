/**
 * Player.js - Player with rigged character model and animations
 */

class Player {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        // Character rig
        this.rig = null;
        this.animator = null;
        
        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 20;
        this.speed = 0.2;
        this.runSpeed = 0.35;
        
        // State
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.rotation = 0;
        this.isMoving = false;
        this.isRunning = false;
        
        // Abilities
        this.dashCharges = 2;
        this.maxDashCharges = 2;
        this.dashCooldown = 0;
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        this.castCooldown = 0;
        
        // Combat
        this.isAttacking = false;
        this.isDashing = false;
        this.isHit = false;
        
        this.active = true;
        this.radius = 0.5;
        this.pushable = false;
        
        this.createCharacter();
        
        // Register with systems
        const collision = engine.getSystem('collision');
        if (collision) collision.register(this, 'player');
    }
    
    /**
     * Create rigged character
     */
    createCharacter() {
        // Create character rig
        this.rig = new CharacterRig(this.engine, 'player');
        this.rig.setPosition(this.position.x, this.position.y, this.position.z);
        
        // Setup animation
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            this.animator = animSystem.createAnimator(this, this.rig.getSkeleton());
        }
        
        // Get root for transformations
        this.mesh = this.rig.getRootNode();
    }
    
    /**
     * Update player
     */
    update(deltaTime, input) {
        if (!this.active) return;
        
        // Get movement input
        const moveVec = input.getMovementVector();
        
        // Check if running (holding shift)
        this.isRunning = input.isKeyDown('shift');
        const actualSpeed = this.isRunning ? this.runSpeed : this.speed;
        
        // Apply movement
        if (!this.isAttacking && !this.isDashing) {
            this.velocity.x = moveVec.x * actualSpeed;
            this.velocity.z = moveVec.z * actualSpeed;
            
            this.position.x += this.velocity.x;
            this.position.z += this.velocity.z;
            
            // Clamp to arena bounds
            this.position.x = Math.max(-18, Math.min(18, this.position.x));
            this.position.z = Math.max(-18, Math.min(18, this.position.z));
            
            // Update rig position
            this.rig.setPosition(this.position.x, this.position.y, this.position.z);
            
            this.isMoving = this.velocity.length() > 0.01;
        }
        
        // Rotate towards mouse
        if (input.mouse.worldPos) {
            const dx = input.mouse.worldPos.x - this.position.x;
            const dz = input.mouse.worldPos.z - this.position.z;
            this.rotation = Math.atan2(dx, dz);
            this.rig.setRotation(0, this.rotation, 0);
        }
        
        // Update animation state
        const animSystem = this.engine.getSystem('animation');
        if (animSystem && !this.isAttacking && !this.isDashing) {
            animSystem.setMovementState(this, this.velocity);
        }
        
        // Update cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.castCooldown > 0) this.castCooldown--;
        
        // Recharge dash
        if (this.dashCooldown === 0 && this.dashCharges < this.maxDashCharges) {
            this.dashCharges++;
            this.dashCooldown = 120; // 2 seconds
        }
    }
    
    /**
     * Attack
     */
    attack() {
        if (this.attackCooldown > 0 || this.isAttacking) return null;
        
        this.isAttacking = true;
        this.attackCooldown = 30; // 0.5s
        
        // Play attack animation
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            animSystem.playAttack(this);
        }
        
        // Clear attacking flag after animation
        setTimeout(() => {
            this.isAttacking = false;
        }, 333); // Match animation duration
        
        return {
            damage: this.damage,
            position: this.position.clone(),
            rotation: this.rotation
        };
    }
    
    /**
     * Dash
     */
    dash() {
        if (this.dashCharges <= 0 || this.isDashing) return false;
        
        this.isDashing = true;
        this.dashCharges--;
        
        // Play dash animation
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            animSystem.playDash(this);
        }
        
        // Dash movement boost
        const dashDirection = new BABYLON.Vector3(
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        );
        
        const dashSpeed = 2.0;
        const dashDuration = 15; // frames
        let dashFrame = 0;
        
        const dashInterval = setInterval(() => {
            dashFrame++;
            
            if (dashFrame >= dashDuration) {
                clearInterval(dashInterval);
                this.isDashing = false;
                return;
            }
            
            // Apply dash movement
            const t = dashFrame / dashDuration;
            const speed = dashSpeed * (1 - t); // Slow down over time
            
            this.position.x += dashDirection.x * speed * 0.1;
            this.position.z += dashDirection.z * speed * 0.1;
            
            // Clamp
            this.position.x = Math.max(-18, Math.min(18, this.position.x));
            this.position.z = Math.max(-18, Math.min(18, this.position.z));
            
            this.rig.setPosition(this.position.x, this.position.y, this.position.z);
        }, 16);
        
        // Particle effect
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createSmokeTrail(this.position.clone(), 300);
        }
        
        return true;
    }
    
    /**
     * Use special
     */
    useSpecial() {
        if (this.specialCooldown > 0) return null;
        
        this.specialCooldown = 180; // 3s
        
        return {
            damage: this.damage * 1.5,
            position: this.position.clone()
        };
    }
    
    /**
     * Use cast
     */
    useCast() {
        if (this.castCooldown > 0) return null;
        
        this.castCooldown = 120; // 2s
        
        return {
            damage: this.damage * 0.8,
            position: this.position.clone(),
            rotation: this.rotation
        };
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.isDashing) return; // Invulnerable while dashing
        
        this.health -= amount;
        this.engine.emit('player:damage', {
            health: this.health,
            maxHealth: this.maxHealth
        });
        
        // Play hit animation
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            animSystem.playHit(this);
        }
        
        // Particle effect
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createBloodSplatter(this.position.clone(), 0.8);
        }
        
        // Camera shake
        const camera = this.engine.getSystem('camera');
        if (camera) {
            camera.shake(0.5, 0.2);
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Heal
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.engine.emit('player:heal', {
            health: this.health,
            maxHealth: this.maxHealth
        });
    }
    
    /**
     * Die
     */
    die() {
        this.active = false;
        
        // Play death animation
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            // Death animation would go here
        }
        
        this.engine.emit('player:death');
    }
    
    /**
     * Dispose
     */
    dispose() {
        if (this.rig) {
            this.rig.dispose();
        }
        
        const animSystem = this.engine.getSystem('animation');
        if (animSystem) {
            animSystem.removeAnimator(this);
        }
    }
}
