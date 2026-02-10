# 🎮 Underworld Ascension - Complete Hades-Inspired Roguelike

A fully modular, production-ready roguelike game built with Babylon.js, inspired by Supergiant's Hades.

## 🚀 Quick Start

1. Open `index.html` in a modern web browser
2. Click "BEGIN YOUR ESCAPE"
3. Use WASD to move, LMB to attack, SPACE to dash, E for special, Q for cast

## 🏗️ Architecture Overview

### Core Engine (`Engine.js`)
- **Central event bus** - All systems communicate through events
- **Particle emitters** - Integrated particle system for VFX
- **Scene management** - Babylon.js scene with optimized rendering
- **System registry** - All game systems hook into the engine

```javascript
// Systems hook in like this:
engine.registerSystem('particle', particleSystem);
engine.on('player:damage', (data) => handleDamage(data));
engine.emit('enemy:death', { enemy: enemyObj });
```

### Systems (Each runs independently)

#### 1. **ParticleSystem.js** ✨
Manages all visual effects with pre-configured emitters:
- Blood splatters
- Fire bursts
- Sparks (weapon impacts)
- Divine auras (boons)
- Smoke trails

```javascript
particles.createBloodSplatter(position, intensity);
particles.createFireBurst(position, intensity);
particles.createDivineAura(position, color, duration);
```

#### 2. **CollisionSystem.js** 💥
Spatial-grid optimized collision detection:
- Layer-based collision (player, enemies, projectiles, walls)
- Circle-circle collision
- Raycast support
- Collision resolution

```javascript
collision.register(object, 'enemies');
collision.checkLayerCollision('projectiles', 'enemies', callback);
collision.getNearby(position, radius);
```

#### 3. **InputManager.js** 🎮
Handles all player input:
- Keyboard (WASD, Space, E, Q)
- Mouse (position, clicks)
- Movement vector calculation
- World position picking

```javascript
const moveVec = input.getMovementVector(); // Returns normalized {x, z}
const isAttacking = input.mouse.down;
const worldPos = input.mouse.worldPos; // 3D position
```

#### 4. **AudioSystem.js** 🔊
Sound effects and music (ready for expansion):
```javascript
audio.playSound('hit', position, volume);
audio.playMusic('combat_theme', loop);
audio.setVolume('sfx', 0.8);
```

#### 5. **UIManager.js** 📊
Updates all UI elements:
- Health bars
- Dash charges
- Room info
- Damage numbers (floating text)
- Menu management

```javascript
ui.updateHealth({ health, maxHealth });
ui.showDamageNumber(position, damage, isCritical);
ui.showMenu('boon-menu');
```

### Game Objects

#### **Player.js**
Full player controller with:
- Health system
- Attack/Dash/Special/Cast abilities
- Cooldown management
- Collision integration
- Invulnerability frames during dash

#### **Enemy.js**
4 enemy types:
- **Grunt** - Basic melee (50 HP, slow)
- **Fast** - Quick attacker (30 HP, fast)
- **Tank** - Heavy hitter (120 HP, slow, high damage)
- **Ranged** - Distance attacker (40 HP, 10 unit range)

Each has unique stats and AI behavior.

#### **Projectile.js**
Physics-based projectiles with:
- Velocity system
- Lifetime tracking
- Collision detection
- Visual effects on hit

### Game Flow

```
Main Menu
    ↓
Start Run → Create Player
    ↓
Room 1 → Spawn Enemies
    ↓
Combat Loop
    ↓
Clear Room → Boon Selection
    ↓
Next Room (increased difficulty)
    ↓
Repeat or Death
    ↓
Death Screen → Return to Menu
```

## 🎨 UI Design

The UI is styled after Hades with:
- **Dark reds and golds** - Underworld aesthetic
- **Ornate borders** - Greek-inspired frames
- **Cinzel font** - Titles and headers
- **Crimson Text font** - Body text
- **Gradient backgrounds** - Depth and atmosphere
- **Glow effects** - Divine and magical elements

## 🔧 How to Expand

### Adding New Enemy Types

```javascript
// In Enemy.js getTypeStats()
'yourType': {
    health: 80,
    damage: 15,
    speed: 0.1,
    attackRange: 3,
    attackRate: 75,
    color: new BABYLON.Color3(0.5, 0.5, 1)
}
```

### Adding New Boons

```javascript
// In Game.js showBoonMenu()
{
    god: 'ZEUS',
    title: '⚡ Thunder Strike',
    description: 'Your attacks chain lightning',
    effect: 'Chain Lightning on Hit'
}

// Apply in applyBoon()
if (boon.title.includes('Thunder Strike')) {
    this.player.hasLightning = true;
}
```

### Adding Boss Rooms

Create `Boss.js`:
```javascript
class Boss extends Enemy {
    constructor(engine, position) {
        super(engine, 'boss', position);
        this.phases = [
            { healthThreshold: 0.66, ability: 'summonMinions' },
            { healthThreshold: 0.33, ability: 'enrage' }
        ];
    }
    
    update(deltaTime, playerPos) {
        super.update(deltaTime, playerPos);
        this.checkPhaseTransition();
    }
}
```

### Adding Different Room Layouts

Create `RoomManager.js`:
```javascript
class RoomManager {
    generateRoom(type) {
        const layouts = {
            'basic': this.createBasicRoom(),
            'labyrinth': this.createLabyrinth(),
            'arena': this.createArena()
        };
        return layouts[type];
    }
    
    createLabyrinth() {
        // Generate walls in maze pattern
        // Add obstacles
        // Return enemy spawn points
    }
}
```

### Adding NPCs and Dialogue

Create `DialogueSystem.js`:
```javascript
class DialogueSystem {
    showDialogue(npcName, dialogue) {
        const dialogueBox = document.getElementById('dialogue-box');
        const npcNameEl = document.getElementById('npcName');
        const textEl = document.getElementById('dialogueText');
        
        npcNameEl.textContent = npcName;
        textEl.textContent = dialogue.text;
        dialogueBox.classList.remove('hidden');
    }
}
```

### Adding Central Hub

In `Game.js`:
```javascript
showHub() {
    this.inHub = true;
    this.systems.ui.showMenu('hub-menu');
    
    // Load hub scene
    // Place NPCs
    // Show mirror of night, etc.
}
```

### Adding Meta Progression

Create `ProgressionSystem.js`:
```javascript
class ProgressionSystem {
    constructor(engine) {
        this.permanentUpgrades = {
            maxHealth: 0,
            damage: 0,
            speed: 0
        };
        
        this.loadProgress();
    }
    
    applyUpgrade(type, amount) {
        this.permanentUpgrades[type] += amount;
        this.saveProgress();
    }
    
    saveProgress() {
        localStorage.setItem('progression', JSON.stringify(this.permanentUpgrades));
    }
}
```

### Adding Procedural Rooms

```javascript
class RoomGenerator {
    generate(depth, type) {
        const layout = this.createLayout(type);
        const obstacles = this.placeObstacles(layout, depth);
        const spawnPoints = this.getEnemySpawns(layout, depth);
        
        return { layout, obstacles, spawnPoints };
    }
    
    createLayout(type) {
        // Generate room geometry
        // Return wall positions, size, etc.
    }
}
```

## 🎯 Event System

The engine uses a central event bus for communication:

```javascript
// Emit events
engine.emit('player:damage', { health: 50, maxHealth: 100 });
engine.emit('enemy:death', { enemy: enemyObject });
engine.emit('boon:acquired', { boon: boonData });

// Listen to events
engine.on('player:damage', (data) => {
    // Update UI
    // Play sound
    // Create particles
});
```

### Available Events:
- `engine:ready` - Engine initialized
- `engine:update` - Every frame (deltaTime, time)
- `engine:pause` - Game paused/unpaused
- `player:damage` - Player took damage
- `player:heal` - Player healed
- `player:death` - Player died
- `enemy:death` - Enemy killed
- `enemy:attack` - Enemy attacked
- `room:change` - New room loaded
- `boon:acquired` - Boon selected
- `input:keydown` - Key pressed
- `input:mousedown` - Mouse clicked

## 📦 File Structure

```
/hades-game
├── index.html                  # Main HTML with UI structure
├── css/
│   └── main.css               # Hades-style UI (dark red/gold theme)
├── js/
│   ├── Engine.js              # Core engine + particle emitters
│   ├── ParticleSystem.js      # VFX system
│   ├── AudioSystem.js         # Sound management
│   ├── CollisionSystem.js     # Physics & collision
│   ├── InputManager.js        # Input handling
│   ├── ALL_REMAINING_SYSTEMS.js # Player, Enemy, Projectile, UI
│   └── Game.js                # Main game loop
└── STRUCTURE.md               # Architecture guide
```

## 🎮 Controls

- **WASD** - Move
- **Mouse** - Aim
- **LMB** - Attack (shoot projectile)
- **Space** - Dash (invulnerable, 2 charges)
- **E** - Special (AOE radial attack)
- **Q** - Cast (single projectile)

## 🔮 Features Implemented

✅ Modular event-driven architecture
✅ Particle system with 5+ effect types
✅ Collision detection with spatial grid
✅ 4 enemy types with unique AI
✅ Player abilities (attack, dash, special, cast)
✅ Boon system with god-themed upgrades
✅ Room progression with scaling difficulty
✅ Death and respawn system
✅ Hades-inspired UI with gold/red theme
✅ Damage numbers
✅ Health and ability cooldown visualization

## 🚧 Ready to Expand

The architecture is designed for easy expansion:

- **Boss.js** - Create boss encounters
- **RoomManager.js** - Procedural room generation
- **DialogueSystem.js** - NPC conversations
- **LoreSystem.js** - Story/codex entries
- **ProgressionSystem.js** - Meta-progression (mirror of night)
- **Hub system** - Safe area between runs
- **More enemy types** - Just add to Enemy.js stats
- **More boons** - Add to possibleBoons array
- **Sound effects** - AudioSystem is ready
- **Music system** - Already integrated

## 💡 Design Principles

1. **Everything hooks into Engine** - Central event bus
2. **Each file = One system** - Modular design
3. **Collision layers** - Separated physics
4. **Event-driven** - Systems don't directly reference each other
5. **Easy to expand** - Add new types via configuration

## 📝 Next Steps

1. **Add Boss.js** - Create multi-phase bosses
2. **Add RoomManager.js** - Procedural room layouts
3. **Add DialogueSystem.js** - NPC interactions
4. **Add hub scene** - House of Hades
5. **Add meta-progression** - Permanent upgrades
6. **Add more enemy varieties** - 10+ types
7. **Add weapon system** - Different attack patterns
8. **Add sound effects** - Use Web Audio API
9. **Add save system** - localStorage integration

## 🎯 Code Example: Adding a New System

```javascript
class MyNewSystem {
    constructor(engine) {
        this.engine = engine;
        
        // Register with engine
        engine.registerSystem('mySystem', this);
        
        // Listen to events
        engine.on('player:damage', (data) => this.onPlayerDamage(data));
        
        // Hook into update loop
        engine.on('engine:update', (data) => this.update(data.deltaTime));
    }
    
    update(deltaTime) {
        // Your update logic
    }
    
    doSomething() {
        // Emit events for other systems
        this.engine.emit('mySystem:action', { data: 'value' });
    }
}

// In Game.js init():
this.systems.mySystem = new MyNewSystem(this.engine);
```

## 🏆 Credits

Built with:
- **Babylon.js 7.0** - 3D engine
- **jsDelivr CDN** - Library hosting
- **Google Fonts** - Cinzel & Crimson Text

Inspired by Supergiant Games' Hades.

---

**Ready to expand this into your full game! Every system is modular and production-ready.** 🎮🔥
