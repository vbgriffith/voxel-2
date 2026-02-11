/**
 * AssetManager.js - Loads and manages 3D models and textures
 * Uses free assets from Kenney.nl and other CC0 sources
 */

class AssetManager {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        // Asset storage
        this.models = new Map();
        this.textures = new Map();
        this.materials = new Map();
        
        // Asset URLs - Free CC0 models
        this.assetLibrary = {
            // Character models (using simple procedural for now, can be replaced)
            player: null, // Will create procedurally
            
            // Enemy models
            enemyGrunt: null,
            enemyFast: null,
            enemyTank: null,
            enemyRanged: null,
            
            // Boss models
            boss: null,
            
            // Environment
            pillar: null,
            wall: null,
            ground: null,
            
            // Props
            weapon: null,
            shield: null,
            
            // Textures (using data URIs for embedded textures)
            stoneTexture: this.createStoneTexture(),
            metalTexture: this.createMetalTexture(),
            bloodTexture: this.createBloodTexture(),
            glowTexture: this.createGlowTexture()
        };
        
        engine.registerSystem('assets', this);
        console.log('[AssetManager] Initialized');
    }
    
    /**
     * Load all assets
     */
    async loadAllAssets() {
        console.log('[AssetManager] Loading assets...');
        
        // Create procedural models (these can be replaced with GLB files)
        await this.createProceduralModels();
        
        console.log('[AssetManager] Assets loaded!');
        this.engine.emit('assets:loaded');
    }
    
    /**
     * Create procedural models (better than basic cylinders)
     */
    async createProceduralModels() {
        // Player character - stylized warrior
        this.models.set('player', this.createPlayerModel());
        
        // Enemy models
        this.models.set('enemyGrunt', this.createGruntModel());
        this.models.set('enemyFast', this.createFastModel());
        this.models.set('enemyTank', this.createTankModel());
        this.models.set('enemyRanged', this.createRangedModel());
        
        // Boss
        this.models.set('boss', this.createBossModel());
        
        // Environment
        this.models.set('pillar', this.createPillarModel());
    }
    
    /**
     * Create stylized player character
     */
    createPlayerModel() {
        const parent = new BABYLON.TransformNode('playerModel', this.scene);
        
        // Body (capsule-like)
        const body = BABYLON.MeshBuilder.CreateCapsule('playerBody', {
            height: 1.6,
            radius: 0.35,
            subdivisions: 16
        }, this.scene);
        body.position.y = 0.8;
        body.parent = parent;
        
        // Create gradient material (blue hero)
        const bodyMat = new BABYLON.StandardMaterial('playerBodyMat', this.scene);
        bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.9);
        bodyMat.specularColor = new BABYLON.Color3(0.6, 0.7, 1);
        bodyMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
        bodyMat.specularPower = 64;
        body.material = bodyMat;
        
        // Head
        const head = BABYLON.MeshBuilder.CreateSphere('playerHead', {
            diameter: 0.5,
            segments: 16
        }, this.scene);
        head.position.y = 1.9;
        head.parent = parent;
        head.material = bodyMat.clone('headMat');
        head.material.emissiveColor = new BABYLON.Color3(0.15, 0.25, 0.5);
        
        // Shoulders (small spheres)
        const shoulderL = BABYLON.MeshBuilder.CreateSphere('shoulderL', {
            diameter: 0.3
        }, this.scene);
        shoulderL.position.set(-0.45, 1.5, 0);
        shoulderL.parent = parent;
        shoulderL.material = bodyMat;
        
        const shoulderR = shoulderL.clone('shoulderR');
        shoulderR.position.x = 0.45;
        shoulderR.parent = parent;
        
        // Weapon - glowing sword
        const weapon = BABYLON.MeshBuilder.CreateBox('playerWeapon', {
            width: 0.15,
            height: 0.15,
            depth: 1.2
        }, this.scene);
        weapon.position.set(0.5, 1.2, 0.6);
        weapon.rotation.x = Math.PI / 4;
        weapon.parent = parent;
        
        const weaponMat = new BABYLON.StandardMaterial('weaponMat', this.scene);
        weaponMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.3);
        weaponMat.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0.1);
        weaponMat.specularColor = new BABYLON.Color3(1, 1, 0.5);
        weaponMat.specularPower = 128;
        weapon.material = weaponMat;
        
        // Cape/back piece
        const cape = BABYLON.MeshBuilder.CreateBox('cape', {
            width: 0.6,
            height: 0.8,
            depth: 0.05
        }, this.scene);
        cape.position.set(0, 1.2, -0.4);
        cape.parent = parent;
        
        const capeMat = new BABYLON.StandardMaterial('capeMat', this.scene);
        capeMat.diffuseColor = new BABYLON.Color3(0.7, 0.1, 0.1);
        capeMat.emissiveColor = new BABYLON.Color3(0.2, 0, 0);
        cape.material = capeMat;
        
        parent.setEnabled(false); // Template, will be cloned
        return parent;
    }
    
    /**
     * Create grunt enemy - blocky warrior
     */
    createGruntModel() {
        const parent = new BABYLON.TransformNode('gruntModel', this.scene);
        
        // Body
        const body = BABYLON.MeshBuilder.CreateBox('gruntBody', {
            width: 0.7,
            height: 1.4,
            depth: 0.5
        }, this.scene);
        body.position.y = 0.7;
        body.parent = parent;
        
        const mat = new BABYLON.StandardMaterial('gruntMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
        body.material = mat;
        
        // Head
        const head = BABYLON.MeshBuilder.CreateBox('gruntHead', {
            width: 0.5,
            height: 0.5,
            depth: 0.5
        }, this.scene);
        head.position.y = 1.6;
        head.parent = parent;
        head.material = mat;
        
        // Spikes on shoulders
        const spike1 = BABYLON.MeshBuilder.CreateCylinder('spike1', {
            height: 0.4,
            diameterTop: 0,
            diameterBottom: 0.15
        }, this.scene);
        spike1.position.set(-0.45, 1.3, 0);
        spike1.rotation.z = Math.PI / 6;
        spike1.parent = parent;
        spike1.material = mat;
        
        const spike2 = spike1.clone('spike2');
        spike2.position.x = 0.45;
        spike2.rotation.z = -Math.PI / 6;
        spike2.parent = parent;
        
        parent.setEnabled(false);
        return parent;
    }
    
    /**
     * Create fast enemy - sleek design
     */
    createFastModel() {
        const parent = new BABYLON.TransformNode('fastModel', this.scene);
        
        // Thin, tall body
        const body = BABYLON.MeshBuilder.CreateCapsule('fastBody', {
            height: 1.8,
            radius: 0.25
        }, this.scene);
        body.position.y = 0.9;
        body.parent = parent;
        
        const mat = new BABYLON.StandardMaterial('fastMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.6, 0.1);
        mat.emissiveColor = new BABYLON.Color3(0.4, 0.2, 0);
        mat.specularPower = 128;
        body.material = mat;
        
        // Head
        const head = BABYLON.MeshBuilder.CreateSphere('fastHead', {
            diameter: 0.4
        }, this.scene);
        head.position.y = 1.9;
        head.parent = parent;
        head.material = mat;
        
        // Speed trails (visual only)
        const trail1 = BABYLON.MeshBuilder.CreateBox('trail1', {
            width: 0.1,
            height: 0.6,
            depth: 0.8
        }, this.scene);
        trail1.position.set(-0.3, 1, -0.5);
        trail1.parent = parent;
        const trailMat = mat.clone('trailMat');
        trailMat.alpha = 0.5;
        trail1.material = trailMat;
        
        const trail2 = trail1.clone('trail2');
        trail2.position.x = 0.3;
        trail2.parent = parent;
        
        parent.setEnabled(false);
        return parent;
    }
    
    /**
     * Create tank enemy - large and imposing
     */
    createTankModel() {
        const parent = new BABYLON.TransformNode('tankModel', this.scene);
        
        // Large body
        const body = BABYLON.MeshBuilder.CreateBox('tankBody', {
            width: 1.2,
            height: 1.6,
            depth: 0.8
        }, this.scene);
        body.position.y = 0.8;
        body.parent = parent;
        
        const mat = new BABYLON.StandardMaterial('tankMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.5, 0.1, 0.5);
        mat.emissiveColor = new BABYLON.Color3(0.2, 0.05, 0.2);
        body.material = mat;
        
        // Head
        const head = BABYLON.MeshBuilder.CreateBox('tankHead', {
            width: 0.7,
            height: 0.6,
            depth: 0.7
        }, this.scene);
        head.position.y = 1.8;
        head.parent = parent;
        head.material = mat;
        
        // Armor plates
        const plate1 = BABYLON.MeshBuilder.CreateBox('plate1', {
            width: 1.4,
            height: 0.3,
            depth: 0.2
        }, this.scene);
        plate1.position.set(0, 1.3, 0.5);
        plate1.parent = parent;
        const plateMat = new BABYLON.StandardMaterial('plateMat', this.scene);
        plateMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        plateMat.metallic = 1;
        plate1.material = plateMat;
        
        // Horns
        const horn1 = BABYLON.MeshBuilder.CreateCylinder('horn1', {
            height: 0.6,
            diameterTop: 0,
            diameterBottom: 0.1
        }, this.scene);
        horn1.position.set(-0.3, 2.2, 0.2);
        horn1.rotation.x = Math.PI / 4;
        horn1.rotation.z = -Math.PI / 6;
        horn1.parent = parent;
        horn1.material = plateMat;
        
        const horn2 = horn1.clone('horn2');
        horn2.position.x = 0.3;
        horn2.rotation.z = Math.PI / 6;
        horn2.parent = parent;
        
        parent.setEnabled(false);
        return parent;
    }
    
    /**
     * Create ranged enemy - archer design
     */
    createRangedModel() {
        const parent = new BABYLON.TransformNode('rangedModel', this.scene);
        
        // Body
        const body = BABYLON.MeshBuilder.CreateCapsule('rangedBody', {
            height: 1.5,
            radius: 0.3
        }, this.scene);
        body.position.y = 0.75;
        body.parent = parent;
        
        const mat = new BABYLON.StandardMaterial('rangedMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.2, 0.7, 0.3);
        mat.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.1);
        body.material = mat;
        
        // Head
        const head = BABYLON.MeshBuilder.CreateSphere('rangedHead', {
            diameter: 0.45
        }, this.scene);
        head.position.y = 1.7;
        head.parent = parent;
        head.material = mat;
        
        // Bow
        const bow = BABYLON.MeshBuilder.CreateTorus('bow', {
            diameter: 0.8,
            thickness: 0.08,
            tessellation: 16
        }, this.scene);
        bow.position.set(-0.5, 1.2, 0);
        bow.rotation.y = Math.PI / 2;
        bow.rotation.z = Math.PI / 4;
        bow.parent = parent;
        
        const bowMat = new BABYLON.StandardMaterial('bowMat', this.scene);
        bowMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        bow.material = bowMat;
        
        parent.setEnabled(false);
        return parent;
    }
    
    /**
     * Create boss model - large and intimidating
     */
    createBossModel() {
        const parent = new BABYLON.TransformNode('bossModel', this.scene);
        
        // Massive body
        const body = BABYLON.MeshBuilder.CreateBox('bossBody', {
            width: 2,
            height: 2.5,
            depth: 1.2
        }, this.scene);
        body.position.y = 1.25;
        body.parent = parent;
        
        const mat = new BABYLON.StandardMaterial('bossMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
        mat.emissiveColor = new BABYLON.Color3(0.5, 0.05, 0.05);
        mat.specularPower = 32;
        body.material = mat;
        
        // Large head
        const head = BABYLON.MeshBuilder.CreateBox('bossHead', {
            width: 1.2,
            height: 1,
            depth: 1
        }, this.scene);
        head.position.y = 3;
        head.parent = parent;
        head.material = mat;
        
        // Crown/horns
        const crown = BABYLON.MeshBuilder.CreateTorus('crown', {
            diameter: 1.5,
            thickness: 0.15
        }, this.scene);
        crown.position.y = 3.5;
        crown.parent = parent;
        const crownMat = new BABYLON.StandardMaterial('crownMat', this.scene);
        crownMat.diffuseColor = new BABYLON.Color3(1, 0.84, 0);
        crownMat.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0);
        crown.material = crownMat;
        
        // Shoulder armor
        const shoulder1 = BABYLON.MeshBuilder.CreateSphere('shoulder1', {
            diameter: 0.8
        }, this.scene);
        shoulder1.position.set(-1.2, 2.2, 0);
        shoulder1.parent = parent;
        shoulder1.material = crownMat;
        
        const shoulder2 = shoulder1.clone('shoulder2');
        shoulder2.position.x = 1.2;
        shoulder2.parent = parent;
        
        // Weapons
        const weapon1 = BABYLON.MeshBuilder.CreateBox('weapon1', {
            width: 0.3,
            height: 0.3,
            depth: 2
        }, this.scene);
        weapon1.position.set(-1.5, 1.5, 1);
        weapon1.rotation.x = Math.PI / 4;
        weapon1.parent = parent;
        weapon1.material = crownMat;
        
        const weapon2 = weapon1.clone('weapon2');
        weapon2.position.x = 1.5;
        weapon2.parent = parent;
        
        parent.setEnabled(false);
        return parent;
    }
    
    /**
     * Create enhanced pillar
     */
    createPillarModel() {
        const parent = new BABYLON.TransformNode('pillarModel', this.scene);
        
        // Main pillar
        const pillar = BABYLON.MeshBuilder.CreateCylinder('pillar', {
            height: 4,
            diameterTop: 1.2,
            diameterBottom: 1.5,
            tessellation: 12
        }, this.scene);
        pillar.position.y = 2;
        pillar.parent = parent;
        
        const mat = new BABYLON.StandardMaterial('pillarMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.25);
        mat.bumpTexture = this.assetLibrary.stoneTexture;
        pillar.material = mat;
        
        // Capital (top)
        const capital = BABYLON.MeshBuilder.CreateCylinder('capital', {
            height: 0.3,
            diameter: 1.8
        }, this.scene);
        capital.position.y = 4.15;
        capital.parent = parent;
        capital.material = mat;
        
        // Base
        const base = BABYLON.MeshBuilder.CreateCylinder('base', {
            height: 0.4,
            diameter: 1.8
        }, this.scene);
        base.position.y = 0.2;
        base.parent = parent;
        base.material = mat;
        
        parent.setEnabled(false);
        return parent;
    }
    
    /**
     * Get a model instance (cloned from template)
     */
    getInstance(modelName) {
        const template = this.models.get(modelName);
        if (!template) {
            console.warn(`[AssetManager] Model not found: ${modelName}`);
            return null;
        }
        
        const instance = template.clone(modelName + '_instance');
        instance.setEnabled(true);
        
        // Enable all children
        instance.getChildMeshes().forEach(mesh => {
            mesh.setEnabled(true);
        });
        
        return instance;
    }
    
    /**
     * Create procedural textures
     */
    createStoneTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4"/>
                    </filter>
                    <rect width="256" height="256" fill="#3a2a2a" filter="url(#noise)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createMetalTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
                    <defs>
                        <linearGradient id="metal">
                            <stop offset="0%" stop-color="#888"/>
                            <stop offset="50%" stop-color="#ccc"/>
                            <stop offset="100%" stop-color="#666"/>
                        </linearGradient>
                    </defs>
                    <rect width="256" height="256" fill="url(#metal)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createBloodTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                    <circle cx="32" cy="32" r="28" fill="#8B0000" opacity="0.9"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createGlowTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
                    <radialGradient id="glow">
                        <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
                        <stop offset="50%" stop-color="#ffd700" stop-opacity="0.7"/>
                        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                    </radialGradient>
                    <circle cx="64" cy="64" r="64" fill="url(#glow)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
}
