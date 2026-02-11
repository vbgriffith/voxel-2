/**
 * RoomManager.js - Manages different room types with unique layouts
 * 5 Room Types: Battle, Boss, Rest, Hub, Final
 */

class RoomManager {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        // Current room data
        this.currentRoom = null;
        this.roomHistory = [];
        this.roomDepth = 0;
        
        // Room type definitions
        this.roomTypes = {
            BATTLE: 'battle',
            BOSS: 'boss',
            REST: 'rest',
            HUB: 'hub',
            FINAL: 'final'
        };
        
        // Room configurations
        this.roomConfigs = {
            battle: {
                name: 'Chamber of Combat',
                size: { width: 40, depth: 40 },
                enemyCount: { min: 3, max: 8 },
                hasChest: true,
                chestChance: 0.3,
                hasPits: true,
                hasTraps: true,
                floorTexture: 'battle_floor.png',
                wallTexture: 'battle_wall.png',
                lightColor: new BABYLON.Color3(0.8, 0.6, 0.5),
                ambientIntensity: 0.4,
                doorType: 'locked' // Unlocks after combat
            },
            boss: {
                name: 'Throne of the Damned',
                size: { width: 50, depth: 50 },
                enemyCount: { min: 1, max: 1 }, // Just the boss
                hasChest: true,
                chestChance: 1.0, // Always has reward
                hasPits: true,
                hasTraps: false,
                floorTexture: 'boss_floor.png',
                wallTexture: 'boss_wall.png',
                lightColor: new BABYLON.Color3(1, 0.2, 0.2),
                ambientIntensity: 0.3,
                doorType: 'locked' // Unlocks after boss
            },
            rest: {
                name: 'Sanctuary of Respite',
                size: { width: 30, depth: 30 },
                enemyCount: { min: 0, max: 0 },
                hasChest: false,
                chestChance: 0,
                hasPits: false,
                hasTraps: false,
                hasNPCs: true,
                npcCount: { min: 1, max: 2 },
                floorTexture: 'rest_floor.png',
                wallTexture: 'rest_wall.png',
                lightColor: new BABYLON.Color3(0.6, 0.8, 0.6),
                ambientIntensity: 0.6,
                doorType: 'open' // Always open
            },
            hub: {
                name: 'House of Hades',
                size: { width: 45, depth: 45 },
                enemyCount: { min: 0, max: 0 },
                hasChest: false,
                chestChance: 0,
                hasPits: false,
                hasTraps: false,
                hasNPCs: true,
                npcCount: { min: 3, max: 5 },
                hasShop: true,
                floorTexture: 'hub_floor.png',
                wallTexture: 'hub_wall.png',
                lightColor: new BABYLON.Color3(0.9, 0.8, 0.6),
                ambientIntensity: 0.7,
                doorType: 'open'
            },
            final: {
                name: 'Gates of Olympus',
                size: { width: 55, depth: 55 },
                enemyCount: { min: 1, max: 1 }, // Final boss
                hasChest: true,
                chestChance: 1.0,
                hasPits: false,
                hasTraps: false,
                floorTexture: 'final_floor.png',
                wallTexture: 'final_wall.png',
                lightColor: new BABYLON.Color3(1, 0.95, 0.7),
                ambientIntensity: 0.8,
                doorType: 'locked'
            }
        };
        
        // Textures storage
        this.textures = new Map();
        
        engine.registerSystem('room', this);
        this.loadTextures();
        
        console.log('[RoomManager] Initialized with 5 room types');
    }
    
    /**
     * Load all room textures
     */
    loadTextures() {
        const textureNames = [
            'battle_floor', 'battle_wall',
            'boss_floor', 'boss_wall',
            'rest_floor', 'rest_wall',
            'hub_floor', 'hub_wall',
            'final_floor', 'final_wall',
            'stone_bump'
        ];
        
        textureNames.forEach(name => {
            const texture = new BABYLON.Texture(
                `assets/textures/${name}.png`,
                this.scene,
                false,
                false
            );
            texture.uScale = 4;
            texture.vScale = 4;
            this.textures.set(name, texture);
        });
        
        console.log('[RoomManager] Textures loaded');
    }
    
    /**
     * Generate next room type based on progression
     */
    getNextRoomType() {
        this.roomDepth++;
        
        // First room is always hub
        if (this.roomDepth === 1) {
            return this.roomTypes.HUB;
        }
        
        // Boss every 5 rooms
        if (this.roomDepth % 5 === 0 && this.roomDepth < 20) {
            return this.roomTypes.BOSS;
        }
        
        // Final boss at room 20
        if (this.roomDepth === 20) {
            return this.roomTypes.FINAL;
        }
        
        // Random between battle and rest (weighted)
        const rand = Math.random();
        
        // 20% chance of rest room
        if (rand < 0.2) {
            return this.roomTypes.REST;
        }
        
        // 80% chance of battle room
        return this.roomTypes.BATTLE;
    }
    
    /**
     * Create a new room
     */
    createRoom(roomType) {
        // Clear existing room
        this.clearRoom();
        
        const config = this.roomConfigs[roomType];
        const size = config.size;
        
        // Create room object
        this.currentRoom = {
            type: roomType,
            config: config,
            floor: null,
            walls: [],
            doors: [],
            decorations: [],
            enemies: [],
            chests: [],
            npcs: [],
            hazards: [],
            cleared: false
        };
        
        // Build room geometry
        this.createFloor(size, config);
        this.createWalls(size, config);
        this.createDecorations(roomType, size);
        
        // Add doors
        this.createDoors(roomType, size);
        
        // Setup lighting
        this.setupRoomLighting(config);
        
        // Store in history
        this.roomHistory.push({
            type: roomType,
            depth: this.roomDepth
        });
        
        // Emit room created event
        this.engine.emit('room:created', {
            type: roomType,
            config: config,
            depth: this.roomDepth
        });
        
        console.log(`[RoomManager] Created ${roomType} room (depth ${this.roomDepth})`);
        
        return this.currentRoom;
    }
    
    /**
     * Create room floor
     */
    createFloor(size, config) {
        const ground = BABYLON.MeshBuilder.CreateGround('ground', {
            width: size.width,
            height: size.depth
        }, this.scene);
        
        ground.position.y = 0;
        
        // Apply texture
        const mat = new BABYLON.StandardMaterial('floorMat', this.scene);
        const floorTex = this.textures.get(config.floorTexture.replace('.png', ''));
        
        if (floorTex) {
            mat.diffuseTexture = floorTex;
            
            // Add bump map
            const bumpTex = this.textures.get('stone_bump');
            if (bumpTex) {
                mat.bumpTexture = bumpTex;
            }
        } else {
            // Fallback color
            mat.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.4);
        }
        
        mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = mat;
        
        this.currentRoom.floor = ground;
    }
    
    /**
     * Create room walls
     */
    createWalls(size, config) {
        const wallHeight = 4;
        const wallThickness = 1;
        
        const wallPositions = [
            { pos: [0, wallHeight/2, size.depth/2], size: [size.width, wallHeight, wallThickness] },
            { pos: [0, wallHeight/2, -size.depth/2], size: [size.width, wallHeight, wallThickness] },
            { pos: [size.width/2, wallHeight/2, 0], size: [wallThickness, wallHeight, size.depth] },
            { pos: [-size.width/2, wallHeight/2, 0], size: [wallThickness, wallHeight, size.depth] }
        ];
        
        wallPositions.forEach((data, i) => {
            const wall = BABYLON.MeshBuilder.CreateBox(`wall_${i}`, {
                width: data.size[0],
                height: data.size[1],
                depth: data.size[2]
            }, this.scene);
            
            wall.position = new BABYLON.Vector3(...data.pos);
            
            // Apply wall texture
            const mat = new BABYLON.StandardMaterial(`wallMat_${i}`, this.scene);
            const wallTex = this.textures.get(config.wallTexture.replace('.png', ''));
            
            if (wallTex) {
                mat.diffuseTexture = wallTex;
                
                const bumpTex = this.textures.get('stone_bump');
                if (bumpTex) {
                    mat.bumpTexture = bumpTex;
                }
            } else {
                mat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.5);
            }
            
            mat.emissiveColor = config.lightColor.scale(0.1);
            mat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            wall.material = mat;
            
            this.currentRoom.walls.push(wall);
        });
    }
    
    /**
     * Create room-specific decorations
     */
    createDecorations(roomType, size) {
        switch(roomType) {
            case 'battle':
                this.addBattleDecorations(size);
                break;
            case 'boss':
                this.addBossDecorations(size);
                break;
            case 'rest':
                this.addRestDecorations(size);
                break;
            case 'hub':
                this.addHubDecorations(size);
                break;
            case 'final':
                this.addFinalDecorations(size);
                break;
        }
    }
    
    addBattleDecorations(size) {
        // Pillars
        const pillarPositions = [
            [-10, 0, -10], [10, 0, -10],
            [-10, 0, 10], [10, 0, 10]
        ];
        
        pillarPositions.forEach((pos, i) => {
            const pillar = BABYLON.MeshBuilder.CreateCylinder(`pillar_${i}`, {
                height: 4,
                diameter: 1.5
            }, this.scene);
            pillar.position = new BABYLON.Vector3(...pos);
            
            const mat = new BABYLON.StandardMaterial(`pillarMat_${i}`, this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.35);
            pillar.material = mat;
            
            this.currentRoom.decorations.push(pillar);
        });
        
        // Broken statues
        for (let i = 0; i < 3; i++) {
            const x = (Math.random() - 0.5) * (size.width - 10);
            const z = (Math.random() - 0.5) * (size.depth - 10);
            
            const statue = BABYLON.MeshBuilder.CreateBox(`statue_${i}`, {
                width: 1,
                height: 2,
                depth: 0.8
            }, this.scene);
            statue.position = new BABYLON.Vector3(x, 1, z);
            statue.rotation.y = Math.random() * Math.PI;
            
            const mat = new BABYLON.StandardMaterial(`statueMat_${i}`, this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            statue.material = mat;
            
            this.currentRoom.decorations.push(statue);
        }
    }
    
    addBossDecorations(size) {
        // Throne at back
        const throne = BABYLON.MeshBuilder.CreateBox('throne', {
            width: 3,
            height: 4,
            depth: 2
        }, this.scene);
        throne.position = new BABYLON.Vector3(0, 2, -size.depth/2 + 5);
        
        const mat = new BABYLON.StandardMaterial('throneMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0.1);
        mat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
        throne.material = mat;
        
        this.currentRoom.decorations.push(throne);
        
        // Skull piles (decorative)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size.width / 2 - 5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const pile = BABYLON.MeshBuilder.CreateSphere(`skull_${i}`, {
                diameter: 0.8
            }, this.scene);
            pile.position = new BABYLON.Vector3(x, 0.4, z);
            
            const mat = new BABYLON.StandardMaterial(`skullMat_${i}`, this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.7);
            pile.material = mat;
            
            this.currentRoom.decorations.push(pile);
        }
    }
    
    addRestDecorations(size) {
        // Healing fountain in center
        const fountain = BABYLON.MeshBuilder.CreateCylinder('fountain', {
            height: 1.5,
            diameter: 3
        }, this.scene);
        fountain.position.y = 0.75;
        
        const mat = new BABYLON.StandardMaterial('fountainMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        mat.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.8);
        fountain.material = mat;
        
        this.currentRoom.decorations.push(fountain);
        
        // Benches around fountain
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 8;
            const z = Math.sin(angle) * 8;
            
            const bench = BABYLON.MeshBuilder.CreateBox(`bench_${i}`, {
                width: 2,
                height: 0.5,
                depth: 0.8
            }, this.scene);
            bench.position = new BABYLON.Vector3(x, 0.5, z);
            bench.rotation.y = angle;
            
            const mat = new BABYLON.StandardMaterial(`benchMat_${i}`, this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3);
            bench.material = mat;
            
            this.currentRoom.decorations.push(bench);
        }
    }
    
    addHubDecorations(size) {
        // Central platform
        const platform = BABYLON.MeshBuilder.CreateCylinder('platform', {
            height: 0.3,
            diameter: 8
        }, this.scene);
        platform.position.y = 0.15;
        
        const mat = new BABYLON.StandardMaterial('platformMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.75, 0.7);
        mat.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0.2);
        platform.material = mat;
        
        this.currentRoom.decorations.push(platform);
        
        // Mirror of Night (upgrade station)
        const mirror = BABYLON.MeshBuilder.CreateBox('mirror', {
            width: 2.5,
            height: 3.5,
            depth: 0.2
        }, this.scene);
        mirror.position = new BABYLON.Vector3(-15, 1.75, 0);
        
        const mirrorMat = new BABYLON.StandardMaterial('mirrorMat', this.scene);
        mirrorMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.2);
        mirrorMat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.5);
        mirrorMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        mirror.material = mirrorMat;
        
        this.currentRoom.decorations.push(mirror);
    }
    
    addFinalDecorations(size) {
        // Olympus gates
        const gate = BABYLON.MeshBuilder.CreateBox('gate', {
            width: 12,
            height: 8,
            depth: 1
        }, this.scene);
        gate.position = new BABYLON.Vector3(0, 4, -size.depth/2 + 2);
        
        const mat = new BABYLON.StandardMaterial('gateMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.9, 0.85, 0.6);
        mat.emissiveColor = new BABYLON.Color3(0.8, 0.7, 0.4);
        gate.material = mat;
        
        this.currentRoom.decorations.push(gate);
        
        // Divine pillars
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = size.width / 2 - 8;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const pillar = BABYLON.MeshBuilder.CreateCylinder(`divine_pillar_${i}`, {
                height: 6,
                diameter: 1.8
            }, this.scene);
            pillar.position = new BABYLON.Vector3(x, 3, z);
            
            const mat = new BABYLON.StandardMaterial(`divinePillarMat_${i}`, this.scene);
            mat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.6);
            mat.emissiveColor = new BABYLON.Color3(0.6, 0.5, 0.3);
            pillar.material = mat;
            
            this.currentRoom.decorations.push(pillar);
        }
    }
    
    /**
     * Create doors for the room
     */
    createDoors(roomType, size) {
        // Add doors based on room type
        // For now, just add exit door at far end
        
        const doorSystem = this.engine.getSystem('doors');
        if (doorSystem) {
            const doorPos = new BABYLON.Vector3(0, 2, size.depth/2 - 2);
            const door = doorSystem.createDoor(doorPos, this.roomConfigs[roomType].doorType);
            this.currentRoom.doors.push(door);
        }
    }
    
    /**
     * Setup lighting for room type
     */
    setupRoomLighting(config) {
        // Update ambient light
        const ambientLight = this.scene.getLightByName('ambientLight');
        if (ambientLight) {
            ambientLight.intensity = config.ambientIntensity;
            ambientLight.diffuse = config.lightColor;
        }
        
        // Update main light color
        const mainLight = this.scene.getLightByName('mainLight');
        if (mainLight) {
            mainLight.diffuse = config.lightColor;
        }
    }
    
    /**
     * Clear current room
     */
    clearRoom() {
        if (!this.currentRoom) return;
        
        // Dispose floor
        if (this.currentRoom.floor) {
            this.currentRoom.floor.dispose();
        }
        
        // Dispose walls
        this.currentRoom.walls.forEach(wall => wall.dispose());
        
        // Dispose decorations
        this.currentRoom.decorations.forEach(deco => deco.dispose());
        
        // Clear arrays
        this.currentRoom = null;
    }
    
    /**
     * Mark room as cleared
     */
    markRoomCleared() {
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
            this.engine.emit('room:cleared', { type: this.currentRoom.type });
            
            // Unlock doors
            const doorSystem = this.engine.getSystem('doors');
            if (doorSystem) {
                this.currentRoom.doors.forEach(door => {
                    doorSystem.unlockDoor(door);
                });
            }
        }
    }
    
    /**
     * Get spawn points for enemies
     */
    getEnemySpawnPoints(count) {
        if (!this.currentRoom) return [];
        
        const size = this.currentRoom.config.size;
        const points = [];
        const radius = Math.min(size.width, size.depth) / 2 - 5;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = radius * (0.7 + Math.random() * 0.3);
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            
            points.push(new BABYLON.Vector3(x, 0.9, z));
        }
        
        return points;
    }
    
    /**
     * Get chest spawn point
     */
    getChestSpawnPoint() {
        if (!this.currentRoom) return null;
        
        const size = this.currentRoom.config.size;
        const x = (Math.random() - 0.5) * (size.width - 10);
        const z = (Math.random() - 0.5) * (size.depth - 10);
        
        return new BABYLON.Vector3(x, 0.5, z);
    }
}
