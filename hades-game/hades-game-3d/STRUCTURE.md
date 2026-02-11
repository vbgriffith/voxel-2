# Underworld Ascension - Full Game Structure

## File Organization

```
hades-game/
├── index.html (Main HTML with UI)
├── css/
│   └── main.css (Hades-style UI)
├── js/
│   ├── Engine.js (Core - DONE)
│   ├── ParticleSystem.js (Particles - DONE)
│   ├── AudioSystem.js (Audio - DONE)
│   ├── CollisionSystem.js (Physics - DONE)
│   ├── InputManager.js (Controls)
│   ├── Player.js (Player controller with collision)
│   ├── Enemy.js (Enemy types)
│   ├── Boss.js (Boss mechanics)
│   ├── Projectile.js (Projectile physics)
│   ├── RoomManager.js (Room generation)
│   ├── BoonSystem.js (Upgrades)
│   ├── DialogueSystem.js (NPC dialogues)
│   ├── UIManager.js (UI updates)
│   ├── ProgressionSystem.js (Meta progression)
│   ├── LoreSystem.js (Story/lore)
│   └── Game.js (Main game loop)
```

## Systems Integration

All systems hook into Engine via:
- `engine.registerSystem(name, system)` - Register system
- `engine.on(event, callback)` - Listen to events
- `engine.emit(event, data)` - Emit events

## Next Steps

Run the game by opening index.html in a browser.
Each JS file is modular and can be enhanced independently.
