/**
 * Game.js - Main game controller
 * Initializes all systems and manages game state
 */

class Game {
    constructor() {
        this.engine = null;
        this.systems = {};
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.bosses = [];
        
        // Game state
        this.currentRoom = 0;
        this.roomCleared = false;
        this.inHub = false;
        this.paused = false;
        
        // Meta progression
        this.runs = 0;
        this.totalKills = 0;
        this.totalRooms = 0;
        this.boons = [];
        
        // Arena bounds
        this.arenaBounds = {
            minX: -18,
            maxX: 18,
            minZ: -18,
            maxZ: 18
        };
    }
    
    /**
     * Initialize game
     */
    init() {
        console.log('[Game] Initializing...');
        
        // Create engine
        this.engine = new Engine();
        this.engine.init();
        
        // Initialize systems
        this.initSystems();
        
        // Create arena
        this.createArena();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup UI button handlers
        this.setupUIHandlers();
        
        // Start game loop
        this.engine.on('engine:update', (data) => this.update(data));
        
        // Show main menu
        this.systems.ui.showMenu('main-menu');
        
        console.log('[Game] Ready!');
    }
    
    /**
     * Initialize all game systems
     */
    initSystems() {
        this.systems.particles = new ParticleSystem(this.engine);
        this.systems.audio = new AudioSystem(this.engine);
        this.systems.collision = new CollisionSystem(this.engine);
        this.systems.input = new InputManager(this.engine);
        this.systems.ui = new UIManager(this.engine);
    }
    
    /**
     * Create the arena
     */
    createArena() {
        // Ground
        const ground = this.engine.createMesh('ground', 'ground', {
            width: 40,
            height: 40
        });
        const groundMat = this.engine.createMaterial('groundMat',
            new BABYLON.Color3(0.2, 0.1, 0.15)
        );
        ground.material = groundMat;
        
        // Walls
        const wallMat = this.engine.createMaterial('wallMat',
            new BABYLON.Color3(0.3, 0.15, 0.2),
            new BABYLON.Color3(0.1, 0.05, 0.1)
        );
        
        const walls = [
            { pos: [0, 1.5, 20], size: [40, 3, 1] },
            { pos: [0, 1.5, -20], size: [40, 3, 1] },
            { pos: [20, 1.5, 0], size: [1, 3, 40] },
            { pos: [-20, 1.5, 0], size: [1, 3, 40] }
        ];
        
        walls.forEach((w, i) => {
            const wall = this.engine.createMesh('box', `wall_${i}`, {
                width: w.size[0],
                height: w.size[1],
                depth: w.size[2]
            });
            wall.position = new BABYLON.Vector3(...w.pos);
            wall.material = wallMat;
        });
        
        // Pillars for cover
        const pillarMat = this.engine.createMaterial('pillarMat',
            new BABYLON.Color3(0.4, 0.2, 0.25)
        );
        
        const pillarPositions = [
            [-10, 2, -10], [10, 2, -10],
            [-10, 2, 10], [10, 2, 10],
            [-10, 2, 0], [10, 2, 0],
            [0, 2, -10], [0, 2, 10]
        ];
        
        pillarPositions.forEach((pos, i) => {
            const pillar = this.engine.createMesh('cylinder', `pillar_${i}`, {
                height: 4,
                diameter: 1.5
            });
            pillar.position = new BABYLON.Vector3(...pos);
            pillar.material = pillarMat;
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Player events
        this.engine.on('player:death', () => this.onPlayerDeath());
        this.engine.on('player:damage', (data) => {
            this.systems.audio.playSound('player_hit');
        });
        
        // Enemy events
        this.engine.on('enemy:death', (data) => {
            this.totalKills++;
            this.checkRoomCleared();
        });
        
        this.engine.on('enemy:attack', (data) => {
            if (this.player && !this.player.isDashing) {
                this.player.takeDamage(data.damage);
            }
        });
        
        // Input events
        this.engine.on('input:keydown', (data) => {
            if (data.key === ' ' && this.player) {
                this.player.dash();
                if (this.player.dashCharges >= 0) {
                    this.systems.ui.updateDashCharges(this.player.dashCharges);
                }
            } else if (data.key === 'e' && this.player) {
                const special = this.player.useSpecial();
                if (special) {
                    this.createSpecialAttack(special);
                }
            } else if (data.key === 'q' && this.player) {
                const cast = this.player.useCast();
                if (cast) {
                    this.createProjectile(cast);
                }
            }
        });
        
        this.engine.on('input:mousedown', (data) => {
            if (data.button === 0 && this.player) { // Left click
                const attack = this.player.attack();
                if (attack) {
                    this.createProjectile(attack);
                }
            }
        });
    }
    
    /**
     * Setup UI button handlers
     */
    setupUIHandlers() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startRun());
        }
        
        const returnBtn = document.getElementById('returnBtn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.systems.ui.showMenu('main-menu');
                this.reset();
            });
        }
    }
    
    /**
     * Main game update loop
     */
    update(data) {
        if (this.paused) return;
        
        // Update player
        if (this.player && this.player.active) {
            this.player.update(data.deltaTime, this.systems.input);
        }
        
        // Update enemies
        if (this.player) {
            this.enemies.forEach(enemy => {
                if (enemy.active) {
                    enemy.update(data.deltaTime, this.player.position);
                }
            });
        }
        
        // Update projectiles
        this.projectiles.forEach((proj, index) => {
            if (proj.active) {
                proj.update(data.deltaTime);
            } else {
                this.projectiles.splice(index, 1);
            }
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        if (this.enemies.length >= 0) {
            this.systems.ui.updateEnemyCount(this.enemies.filter(e => e.active).length);
        }
    }
    
    /**
     * Check all collision interactions
     */
    checkCollisions() {
        // Projectiles vs Enemies
        this.systems.collision.checkLayerCollision('projectiles', 'enemies', (proj, enemy) => {
            if (!proj.hit && proj.active && enemy.active) {
                enemy.takeDamage(proj.damage);
                proj.onHit();
                this.systems.ui.showDamageNumber(enemy.position, proj.damage);
            }
        });
    }
    
    /**
     * Create a projectile
     */
    createProjectile(data) {
        const proj = new Projectile(this.engine, data);
        this.projectiles.push(proj);
    }
    
    /**
     * Create special attack (AOE)
     */
    createSpecialAttack(data) {
        const angles = 8;
        for (let i = 0; i < angles; i++) {
            const angle = (i / angles) * Math.PI * 2;
            const projData = {
                position: data.position,
                damage: data.damage,
                rotation: angle,
                speed: 0.4,
                lifetime: 90,
                radius: 0.35,
                color: new BABYLON.Color3(1, 0.5, 0),
                type: 'special'
            };
            this.createProjectile(projData);
        }
        
        this.systems.particles.createFireBurst(data.position, 1.5);
    }
    
    /**
     * Spawn enemies
     */
    spawnEnemies(count) {
        const radius = 15;
        const types = ['grunt', 'grunt', 'fast', 'tank'];
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const r = radius + Math.random() * 3;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = new Enemy(this.engine, type, new BABYLON.Vector3(x, 0.9, z));
            this.enemies.push(enemy);
        }
    }
    
    /**
     * Start a new run
     */
    startRun() {
        this.reset();
        
        // Create player
        this.player = new Player(this.engine);
        
        // Start first room
        this.currentRoom = 1;
        this.roomCleared = false;
        
        this.spawnEnemies(3);
        
        this.systems.ui.hideMenu('main-menu');
        this.systems.ui.updateHealth({
            health: this.player.health,
            maxHealth: this.player.maxHealth
        });
        this.systems.ui.updateDashCharges(this.player.dashCharges);
        
        this.engine.emit('room:change', {
            name: 'CHAMBER OF TARTARUS',
            depth: this.currentRoom
        });
        
        console.log('[Game] Run started');
    }
    
    /**
     * Check if room is cleared
     */
    checkRoomCleared() {
        const activeEnemies = this.enemies.filter(e => e.active).length;
        
        if (activeEnemies === 0 && !this.roomCleared) {
            this.roomCleared = true;
            this.totalRooms++;
            
            setTimeout(() => {
                this.showBoonMenu();
            }, 1000);
        }
    }
    
    /**
     * Show boon selection
     */
    showBoonMenu() {
        this.paused = true;
        
        const boonOptions = document.getElementById('boon-options');
        if (!boonOptions) return;
        
        boonOptions.innerHTML = '';
        
        const possibleBoons = [
            {
                god: 'ARES',
                title: '💪 Blade Rift',
                description: 'Your attacks deal +50% damage',
                effect: '+50% Attack Damage'
            },
            {
                god: 'APHRODITE',
                title: '❤️ Life Affirmation',
                description: 'Restore health and increase maximum health',
                effect: '+30 Max Health & Full Heal'
            },
            {
                god: 'HERMES',
                title: '⚡ Swift Strike',
                description: 'Your attacks are faster',
                effect: '+40% Attack Speed'
            },
            {
                god: 'ATHENA',
                title: '🛡️ Divine Dash',
                description: 'Gain an additional dash charge',
                effect: '+1 Dash Charge'
            }
        ];
        
        const selected = possibleBoons.sort(() => Math.random() - 0.5).slice(0, 3);
        
        selected.forEach(boon => {
            const div = document.createElement('div');
            div.className = 'boon-option';
            div.innerHTML = `
                <div class="boon-god">${boon.god}</div>
                <div class="boon-title">${boon.title}</div>
                <div class="boon-description">${boon.description}</div>
                <div class="boon-effect">${boon.effect}</div>
            `;
            
            div.addEventListener('click', () => {
                this.applyBoon(boon);
                this.systems.ui.hideMenu('boon-menu');
                this.nextRoom();
            });
            
            boonOptions.appendChild(div);
        });
        
        this.systems.ui.showMenu('boon-menu');
    }
    
    /**
     * Apply a boon to the player
     */
    applyBoon(boon) {
        this.boons.push(boon);
        
        // Apply effects based on title
        if (boon.title.includes('Blade Rift')) {
            this.player.damage *= 1.5;
        } else if (boon.title.includes('Life Affirmation')) {
            this.player.maxHealth += 30;
            this.player.health = this.player.maxHealth;
            this.systems.ui.updateHealth({
                health: this.player.health,
                maxHealth: this.player.maxHealth
            });
        } else if (boon.title.includes('Swift Strike')) {
            this.player.attackCooldown = Math.max(5, this.player.attackCooldown * 0.6);
        } else if (boon.title.includes('Divine Dash')) {
            this.player.maxDashCharges++;
            this.player.dashCharges = this.player.maxDashCharges;
            this.systems.ui.updateDashCharges(this.player.dashCharges);
        }
        
        // Create divine effect
        this.systems.particles.createDivineAura(
            this.player.position,
            new BABYLON.Color4(1, 0.84, 0, 1),
            2000
        );
    }
    
    /**
     * Progress to next room
     */
    nextRoom() {
        this.paused = false;
        this.currentRoom++;
        this.roomCleared = false;
        
        // Clean up
        this.enemies = [];
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];
        
        // Spawn more enemies
        const enemyCount = 3 + this.currentRoom;
        this.spawnEnemies(Math.min(enemyCount, 10));
        
        // Reset player position
        this.player.position.x = 0;
        this.player.position.z = 0;
        
        this.engine.emit('room:change', {
            name: `CHAMBER ${this.currentRoom}`,
            depth: this.currentRoom
        });
    }
    
    /**
     * Handle player death
     */
    onPlayerDeath() {
        this.paused = true;
        this.runs++;
        
        const deathMenu = document.getElementById('death-menu');
        const deathStats = document.getElementById('deathStats');
        const deathQuote = document.getElementById('deathQuote');
        
        if (deathQuote) {
            const quotes = [
                '"The underworld is patient. It will have you again."',
                '"Death is not an ending, merely a return."',
                '"Your father awaits your return, Prince."'
            ];
            deathQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        }
        
        if (deathStats) {
            deathStats.innerHTML = `
                <div>Reached Room: ${this.currentRoom}</div>
                <div>Foes Vanquished: ${this.totalKills}</div>
                <div>Boons Collected: ${this.boons.length}</div>
            `;
        }
        
        this.systems.ui.showMenu('death-menu');
        
        // Update stats
        document.getElementById('totalRuns').textContent = this.runs;
        document.getElementById('totalClears').textContent = this.totalRooms;
        document.getElementById('totalKills').textContent = this.totalKills;
    }
    
    /**
     * Reset game state
     */
    reset() {
        // Clean up entities
        if (this.player) {
            this.player.active = false;
            if (this.player.mesh) this.player.mesh.dispose();
            this.player = null;
        }
        
        this.enemies.forEach(e => {
            if (e.active && e.mesh) e.mesh.dispose();
        });
        this.enemies = [];
        
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];
        
        // Reset state
        this.currentRoom = 0;
        this.roomCleared = false;
        this.boons = [];
        this.paused = false;
        
        // Clear collision system
        this.systems.collision.clear();
        
        // Clear particles
        this.systems.particles.clearAll();
    }
}
