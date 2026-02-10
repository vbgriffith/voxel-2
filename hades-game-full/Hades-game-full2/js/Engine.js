/**
 * Engine.js - Core game engine with particle emitters and event system
 * All game systems hook into this central engine
 */

class Engine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });
        
        this.scene = null;
        this.camera = null;
        this.lights = [];
        
        // Event system for inter-system communication
        this.events = new EventTarget();
        
        // Systems registry
        this.systems = {
            particle: null,
            audio: null,
            collision: null,
            input: null,
            room: null,
            boon: null,
            dialogue: null,
            ui: null,
            progression: null,
            lore: null
        };
        
        // Game state
        this.state = {
            paused: false,
            gameSpeed: 1.0,
            deltaTime: 0,
            time: 0
        };
        
        // Performance monitoring
        this.fps = 60;
        this.lastFrameTime = 0;
    }
    
    /**
     * Initialize the engine and scene
     */
    init() {
        this.createScene();
        this.setupCamera();
        this.setupLighting();
        this.setupPhysics();
        this.setupPostProcessing();
        
        // Register render loop
        this.engine.runRenderLoop(() => this.render());
        
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
        
        // Emit engine ready event
        this.emit('engine:ready');
        
        console.log('[Engine] Initialized successfully');
    }
    
    /**
     * Create the main Babylon.js scene
     */
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.02, 0.01, 0.01);
        
        // Enable fog for atmosphere
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.01;
        this.scene.fogColor = new BABYLON.Color3(0.1, 0.05, 0.05);
        
        // Optimize scene
        this.scene.autoClear = false;
        this.scene.autoClearDepthAndStencil = false;
        
        return this.scene;
    }
    
    /**
     * Setup camera with isometric-like view
     */
    setupCamera() {
        this.camera = new BABYLON.ArcRotateCamera(
            "mainCamera",
            Math.PI / 4, // Alpha - horizontal rotation
            Math.PI / 3, // Beta - vertical angle
            35, // Radius - distance from target
            BABYLON.Vector3.Zero(),
            this.scene
        );
        
        // Camera controls
        this.camera.attachControl(this.canvas, false);
        this.camera.lowerRadiusLimit = 25;
        this.camera.upperRadiusLimit = 50;
        this.camera.lowerBetaLimit = Math.PI / 6;
        this.camera.upperBetaLimit = Math.PI / 2.2;
        
        // Smooth camera
        this.camera.inertia = 0.7;
        this.camera.angularSensibilityX = 2000;
        this.camera.angularSensibilityY = 2000;
        
        return this.camera;
    }
    
    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light
        const ambient = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        ambient.intensity = 0.4;
        ambient.diffuse = new BABYLON.Color3(0.6, 0.3, 0.3);
        ambient.groundColor = new BABYLON.Color3(0.2, 0.05, 0.05);
        this.lights.push(ambient);
        
        // Main directional light
        const mainLight = new BABYLON.DirectionalLight(
            "mainLight",
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        mainLight.intensity = 0.8;
        mainLight.diffuse = new BABYLON.Color3(1, 0.8, 0.6);
        mainLight.specular = new BABYLON.Color3(0.5, 0.4, 0.3);
        this.lights.push(mainLight);
        
        // Rim light for dramatic effect
        const rimLight = new BABYLON.DirectionalLight(
            "rimLight",
            new BABYLON.Vector3(1, 1, 1),
            this.scene
        );
        rimLight.intensity = 0.3;
        rimLight.diffuse = new BABYLON.Color3(1, 0.5, 0);
        this.lights.push(rimLight);
        
        // Dynamic point light (will follow player)
        const playerLight = new BABYLON.PointLight(
            "playerLight",
            BABYLON.Vector3.Zero(),
            this.scene
        );
        playerLight.intensity = 0.5;
        playerLight.diffuse = new BABYLON.Color3(1, 0.7, 0.3);
        playerLight.range = 20;
        this.lights.push(playerLight);
        
        return this.lights;
    }
    
    /**
     * Setup physics (simple collision system)
     */
    setupPhysics() {
        // We'll use a custom collision system for more control
        // Babylon's physics can be heavy for this type of game
        this.scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    }
    
    /**
     * Setup post-processing effects
     */
    setupPostProcessing() {
        // Glow layer for emissive objects
        const glowLayer = new BABYLON.GlowLayer("glow", this.scene, {
            mainTextureFixedSize: 1024,
            blurKernelSize: 64
        });
        glowLayer.intensity = 0.7;
        
        // Vignette for atmosphere
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline",
            true,
            this.scene,
            [this.camera]
        );
        
        pipeline.imageProcessingEnabled = true;
        if (pipeline.imageProcessing) {
            pipeline.imageProcessing.contrast = 1.2;
            pipeline.imageProcessing.exposure = 1.1;
            pipeline.imageProcessing.vignetteEnabled = true;
            pipeline.imageProcessing.vignetteWeight = 1.5;
        }
        
        return pipeline;
    }
    
    /**
     * Main render loop
     */
    render() {
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        
        this.state.deltaTime = deltaTime * this.state.gameSpeed;
        this.state.time += this.state.deltaTime;
        
        if (!this.state.paused) {
            // Update all registered systems
            this.emit('engine:update', {
                deltaTime: this.state.deltaTime,
                time: this.state.time
            });
            
            this.scene.render();
        }
        
        // Update FPS
        this.fps = this.engine.getFps();
    }
    
    /**
     * Handle window resize
     */
    resize() {
        this.engine.resize();
        this.emit('engine:resize');
    }
    
    /**
     * Register a game system
     */
    registerSystem(name, system) {
        if (this.systems.hasOwnProperty(name)) {
            this.systems[name] = system;
            console.log(`[Engine] Registered system: ${name}`);
        } else {
            console.warn(`[Engine] Unknown system type: ${name}`);
        }
    }
    
    /**
     * Get a registered system
     */
    getSystem(name) {
        return this.systems[name];
    }
    
    /**
     * Event emission
     */
    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        this.events.dispatchEvent(event);
    }
    
    /**
     * Event subscription
     */
    on(eventName, callback) {
        this.events.addEventListener(eventName, (e) => callback(e.detail));
    }
    
    /**
     * Event unsubscription
     */
    off(eventName, callback) {
        this.events.removeEventListener(eventName, callback);
    }
    
    /**
     * Pause/unpause game
     */
    setPaused(paused) {
        this.state.paused = paused;
        this.emit('engine:pause', { paused });
    }
    
    /**
     * Set game speed (slow-mo, speed up, etc.)
     */
    setGameSpeed(speed) {
        this.state.gameSpeed = Math.max(0.1, Math.min(speed, 5.0));
        this.emit('engine:speed', { speed: this.state.gameSpeed });
    }
    
    /**
     * Cleanup and dispose
     */
    dispose() {
        this.scene.dispose();
        this.engine.dispose();
        console.log('[Engine] Disposed');
    }
    
    /**
     * Create a mesh factory helper
     */
    createMesh(type, name, options = {}) {
        let mesh;
        
        switch(type) {
            case 'box':
                mesh = BABYLON.MeshBuilder.CreateBox(name, options, this.scene);
                break;
            case 'sphere':
                mesh = BABYLON.MeshBuilder.CreateSphere(name, options, this.scene);
                break;
            case 'cylinder':
                mesh = BABYLON.MeshBuilder.CreateCylinder(name, options, this.scene);
                break;
            case 'plane':
                mesh = BABYLON.MeshBuilder.CreatePlane(name, options, this.scene);
                break;
            case 'ground':
                mesh = BABYLON.MeshBuilder.CreateGround(name, options, this.scene);
                break;
            case 'torus':
                mesh = BABYLON.MeshBuilder.CreateTorus(name, options, this.scene);
                break;
            default:
                console.warn(`[Engine] Unknown mesh type: ${type}`);
                mesh = BABYLON.MeshBuilder.CreateBox(name, options, this.scene);
        }
        
        return mesh;
    }
    
    /**
     * Create a standard material
     */
    createMaterial(name, color, emissive = null) {
        const mat = new BABYLON.StandardMaterial(name, this.scene);
        mat.diffuseColor = color;
        mat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        if (emissive) {
            mat.emissiveColor = emissive;
        }
        
        return mat;
    }
}
