// This file contains all remaining game systems
// In production, these would be separate files

// ============= PLAYER.JS =============
class Player {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.mesh = null;
        this.weapon = null;
        
        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.damage = 20;
        this.speed = 0.2;
        this.dashSpeed = 0.6;
        
        // State
        this.position = new BABYLON.Vector3(0, 1, 0);
        this.rotation = 0;
        this.isDashing = false;
        this.dashTime = 0;
        this.dashCharges = 2;
        this.maxDashCharges = 2;
        
        // Cooldowns (in frames, 60fps)
        this.dashCooldown = 0;
        this.specialCooldown = 0;
        this.castCooldown = 0;
        this.attackCooldown = 0;
        
        this.active = true;
        this.radius = 0.5;
        this.pushable = false; // Player shouldn't be pushed
        
        this.createMesh();
        
        // Register with collision system
        const collision = engine.getSystem('collision');
        if (collision) collision.register(this, 'player');
    }
    
    createMesh() {
        // Player body
        this.mesh = this.engine.createMesh('cylinder', 'player', {
            height: 2,
            diameter: 1
        });
        this.mesh.position = this.position;
        
        const mat = this.engine.createMaterial('playerMat',
            new BABYLON.Color3(0.2, 0.6, 1),
            new BABYLON.Color3(0.1, 0.3, 0.5)
        );
        this.mesh.material = mat;
        
        // Weapon
        this.weapon = this.engine.createMesh('box', 'weapon', {
            width: 0.3,
            height: 0.3,
            depth: 1.5
        });
        this.weapon.position = new BABYLON.Vector3(0.6, 0, 0);
        this.weapon.parent = this.mesh;
        this.weapon.material = mat;
        
        // Update player light position
        const playerLight = this.scene.getLightByName('playerLight');
        if (playerLight) {
            playerLight.position = this.position;
        }
    }
    
    update(deltaTime, input) {
        if (!this.active) return;
        
        // Movement
        const moveVec = input.getMovementVector();
        const actualSpeed = this.isDashing ? this.dashSpeed : this.speed;
        
        this.position.x += moveVec.x * actualSpeed;
        this.position.z += moveVec.z * actualSpeed;
        
        // Clamp to arena
        this.position.x = Math.max(-18, Math.min(18, this.position.x));
        this.position.z = Math.max(-18, Math.min(18, this.position.z));
        
        // Update mesh
        this.mesh.position.copyFrom(this.position);
        
        // Rotate towards mouse
        if (input.mouse.worldPos) {
            const dx = input.mouse.worldPos.x - this.position.x;
            const dz = input.mouse.worldPos.z - this.position.z;
            this.rotation = Math.atan2(dx, dz);
            this.mesh.rotation.y = this.rotation;
        }
        
        // Update dash
        if (this.isDashing) {
            this.dashTime--;
            if (this.dashTime <= 0) {
                this.isDashing = false;
            }
        }
        
        // Update cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.castCooldown > 0) this.castCooldown--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // Recharge dash
        if (this.dashCooldown === 0 && this.dashCharges < this.maxDashCharges) {
            this.dashCharges++;
            this.dashCooldown = 120; // 2 seconds
        }
        
        // Update player light
        const playerLight = this.scene.getLightByName('playerLight');
        if (playerLight) {
            playerLight.position.copyFrom(this.position);
        }
    }
    
    attack() {
        if (this.attackCooldown > 0) return null;
        this.attackCooldown = 20; // 0.33s
        return { damage: this.damage, position: this.position.clone(), rotation: this.rotation };
    }
    
    dash() {
        if (this.dashCharges <= 0) return false;
        
        this.isDashing = true;
        this.dashTime = 15; // 0.25s
        this.dashCharges--;
        
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createSmokeTrail(this.position.clone(), 300);
        }
        
        return true;
    }
    
    useSpecial() {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 180; // 3s
        return { damage: this.damage * 1.5, position: this.position.clone() };
    }
    
    useCast() {
        if (this.castCooldown > 0) return null;
        this.castCooldown = 120; // 2s
        return { damage: this.damage * 0.8, position: this.position.clone(), rotation: this.rotation };
    }
    
    takeDamage(amount) {
        if (this.isDashing) return; // Invulnerable while dashing
        
        this.health -= amount;
        this.engine.emit('player:damage', { health: this.health, maxHealth: this.maxHealth });
        
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createBloodSplatter(this.position.clone(), 0.8);
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.engine.emit('player:heal', { health: this.health, maxHealth: this.maxHealth });
    }
    
    die() {
        this.active = false;
        this.engine.emit('player:death');
    }
}

// ============= ENEMY.JS =============
class Enemy {
    constructor(engine, type, position) {
        this.engine = engine;
        this.scene = engine.scene;
        this.type = type;
        this.mesh = null;
        
        // Get type stats
        const stats = this.getTypeStats(type);
        this.health = stats.health;
        this.maxHealth = stats.health;
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.attackRange = stats.attackRange;
        this.attackCooldown = 0;
        this.attackRate = stats.attackRate;
        this.color = stats.color;
        
        this.position = position.clone();
        this.active = true;
        this.radius = 0.5;
        this.pushable = true;
        
        this.createMesh();
        
        const collision = engine.getSystem('collision');
        if (collision) collision.register(this, 'enemies');
    }
    
    getTypeStats(type) {
        const types = {
            'grunt': {
                health: 50,
                damage: 10,
                speed: 0.08,
                attackRange: 2,
                attackRate: 60,
                color: new BABYLON.Color3(1, 0.2, 0.2)
            },
            'fast': {
                health: 30,
                damage: 15,
                speed: 0.15,
                attackRange: 1.5,
                attackRate: 40,
                color: new BABYLON.Color3(1, 0.5, 0)
            },
            'tank': {
                health: 120,
                damage: 20,
                speed: 0.05,
                attackRange: 2.5,
                attackRate: 90,
                color: new BABYLON.Color3(0.6, 0.1, 0.6)
            },
            'ranged': {
                health: 40,
                damage: 12,
                speed: 0.06,
                attackRange: 10,
                attackRate: 120,
                color: new BABYLON.Color3(0.2, 0.8, 0.2)
            }
        };
        
        return types[type] || types['grunt'];
    }
    
    createMesh() {
        this.mesh = this.engine.createMesh('cylinder', `enemy_${this.type}`, {
            height: 1.8,
            diameter: 1
        });
        this.mesh.position = this.position;
        
        const mat = this.engine.createMaterial(`enemyMat_${this.type}`,
            this.color,
            this.color.scale(0.3)
        );
        this.mesh.material = mat;
    }
    
    update(deltaTime, playerPos) {
        if (!this.active) return;
        
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        // Move towards player or attack
        if (dist > this.attackRange) {
            const moveX = (dx / dist) * this.speed;
            const moveZ = (dz / dist) * this.speed;
            
            this.position.x += moveX;
            this.position.z += moveZ;
            this.mesh.position.copyFrom(this.position);
        }
        
        // Attack
        this.attackCooldown--;
        if (dist <= this.attackRange && this.attackCooldown <= 0) {
            this.attackCooldown = this.attackRate;
            this.engine.emit('enemy:attack', {
                enemy: this,
                damage: this.damage,
                type: this.type
            });
        }
        
        // Rotate towards player
        this.mesh.rotation.y = Math.atan2(dx, dz);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback
        this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.5, 0.5);
        setTimeout(() => {
            if (this.mesh && this.mesh.material) {
                this.mesh.material.emissiveColor = this.color.scale(0.3);
            }
        }, 100);
        
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
        
        if (this.mesh) {
            this.mesh.dispose();
        }
        
        const collision = this.engine.getSystem('collision');
        if (collision) collision.unregister(this, 'enemies');
        
        this.engine.emit('enemy:death', { enemy: this });
    }
}

// ============= PROJECTILE.JS =============
class Projectile {
    constructor(engine, data) {
        this.engine = engine;
        this.scene = engine.scene;
        this.mesh = null;
        
        this.position = data.position.clone();
        this.damage = data.damage;
        this.speed = data.speed || 0.5;
        this.lifetime = data.lifetime || 120;
        this.radius = data.radius || 0.25;
        this.color = data.color || new BABYLON.Color3(1, 1, 0);
        this.type = data.type || 'normal';
        
        const angle = data.rotation;
        this.velocity = new BABYLON.Vector3(
            Math.sin(angle) * this.speed,
            0,
            Math.cos(angle) * this.speed
        );
        
        this.active = true;
        this.hit = false;
        
        this.createMesh();
        
        const collision = engine.getSystem('collision');
        if (collision) collision.register(this, 'projectiles');
    }
    
    createMesh() {
        this.mesh = this.engine.createMesh('sphere', 'projectile', {
            diameter: this.radius * 2
        });
        this.mesh.position = this.position;
        
        const mat = this.engine.createMaterial('projMat', 
            this.color,
            this.color.scale(0.8)
        );
        this.mesh.material = mat;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.position.addInPlace(this.velocity);
        this.mesh.position.copyFrom(this.position);
        
        this.lifetime--;
        if (this.lifetime <= 0 || this.hit) {
            this.destroy();
        }
    }
    
    onHit() {
        this.hit = true;
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createSparks(this.position.clone(), this.velocity.negate(), 0.5);
        }
    }
    
    destroy() {
        this.active = false;
        if (this.mesh) {
            this.mesh.dispose();
        }
        
        const collision = this.engine.getSystem('collision');
        if (collision) collision.unregister(this, 'projectiles');
    }
}

// ============= UI MANAGER.JS =============
class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.elements = {
            healthBar: document.getElementById('healthBar'),
            healthText: document.getElementById('healthText'),
            dashCharges: document.getElementById('dashCharges'),
            roomName: document.getElementById('roomName'),
            roomDepth: document.getElementById('roomDepth'),
            enemyCount: document.getElementById('enemyCount'),
            boonCount: document.getElementById('boonCount')
        };
        
        engine.registerSystem('ui', this);
        this.setupListeners();
        console.log('[UIManager] Initialized');
    }
    
    setupListeners() {
        this.engine.on('player:damage', (data) => this.updateHealth(data));
        this.engine.on('player:heal', (data) => this.updateHealth(data));
        this.engine.on('room:change', (data) => this.updateRoom(data));
    }
    
    updateHealth(data) {
        const percent = (data.health / data.maxHealth) * 100;
        const inner = this.elements.healthBar.querySelector('.bar-inner');
        if (inner) inner.style.width = percent + '%';
        if (this.elements.healthText) {
            this.elements.healthText.textContent = `${Math.max(0, Math.floor(data.health))} / ${data.maxHealth}`;
        }
    }
    
    updateDashCharges(charges) {
        const chargeElements = this.elements.dashCharges.querySelectorAll('.dash-charge');
        chargeElements.forEach((el, i) => {
            el.classList.toggle('ready', i < charges);
        });
    }
    
    updateRoom(data) {
        if (this.elements.roomName) this.elements.roomName.textContent = data.name;
        if (this.elements.roomDepth) this.elements.roomDepth.textContent = `Depth: ${data.depth}`;
    }
    
    updateEnemyCount(count) {
        if (this.elements.enemyCount) {
            this.elements.enemyCount.textContent = `Foes: ${count}`;
        }
    }
    
    showMenu(menuId) {
        document.querySelectorAll('.menu-screen').forEach(el => el.classList.add('hidden'));
        const menu = document.getElementById(menuId);
        if (menu) menu.classList.remove('hidden');
    }
    
    hideMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (menu) menu.classList.add('hidden');
    }
    
    showDamageNumber(position, damage, isCritical = false) {
        const damageContainer = document.getElementById('damage-numbers');
        if (!damageContainer) return;
        
        const el = document.createElement('div');
        el.className = 'damage-number' + (isCritical ? ' critical' : '');
        el.textContent = Math.floor(damage);
        
        // Convert 3D position to 2D screen position
        const screenPos = BABYLON.Vector3.Project(
            position,
            BABYLON.Matrix.Identity(),
            this.engine.scene.getTransformMatrix(),
            this.engine.camera.viewport.toGlobal(
                this.engine.engine.getRenderWidth(),
                this.engine.engine.getRenderHeight()
            )
        );
        
        el.style.left = screenPos.x + 'px';
        el.style.top = screenPos.y + 'px';
        
        damageContainer.appendChild(el);
        
        setTimeout(() => el.remove(), 1000);
    }
}

console.log('[All Systems] Loaded - Player, Enemy, Projectile, UIManager');
