/**
 * ParticleSystem.js - Manages particle emitters for visual effects
 * Hooks into the Engine for updates
 */

class ParticleSystem {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.emitters = new Map();
        this.pools = new Map();
        
        // Pre-create particle textures
        this.textures = {
            blood: this.createBloodTexture(),
            fire: this.createFireTexture(),
            spark: this.createSparkTexture(),
            smoke: this.createSmokeTexture(),
            divine: this.createDivineTexture()
        };
        
        // Register with engine
        this.engine.registerSystem('particle', this);
        this.engine.on('engine:update', (data) => this.update(data.deltaTime));
        
        console.log('[ParticleSystem] Initialized');
    }
    
    /**
     * Update active emitters
     */
    update(deltaTime) {
        this.emitters.forEach((emitter, id) => {
            if (emitter.autoRemove && emitter.system.isStarted() && emitter.system.emitRate === 0) {
                this.removeEmitter(id);
            }
        });
    }
    
    /**
     * Create blood splatter effect
     */
    createBloodSplatter(position, intensity = 1.0) {
        const system = new BABYLON.ParticleSystem("bloodSplatter", 50 * intensity, this.scene);
        system.particleTexture = this.textures.blood;
        
        system.emitter = position.clone();
        system.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
        system.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
        
        system.color1 = new BABYLON.Color4(0.6, 0, 0, 1);
        system.color2 = new BABYLON.Color4(0.8, 0.1, 0.1, 1);
        system.colorDead = new BABYLON.Color4(0.3, 0, 0, 0);
        
        system.minSize = 0.1;
        system.maxSize = 0.4;
        
        system.minLifeTime = 0.3;
        system.maxLifeTime = 0.8;
        
        system.emitRate = 200;
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        
        system.gravity = new BABYLON.Vector3(0, -9.81, 0);
        system.direction1 = new BABYLON.Vector3(-2, 2, -2);
        system.direction2 = new BABYLON.Vector3(2, 5, 2);
        
        system.minAngularSpeed = 0;
        system.maxAngularSpeed = Math.PI;
        
        system.minEmitPower = 3 * intensity;
        system.maxEmitPower = 5 * intensity;
        system.updateSpeed = 0.01;
        
        system.start();
        
        // Auto-stop and cleanup
        setTimeout(() => {
            system.stop();
        }, 100);
        
        const id = `blood_${Date.now()}`;
        this.emitters.set(id, { system, autoRemove: true });
        
        return id;
    }
    
    /**
     * Create fire burst effect
     */
    createFireBurst(position, intensity = 1.0) {
        const system = new BABYLON.ParticleSystem("fireBurst", 100 * intensity, this.scene);
        system.particleTexture = this.textures.fire;
        
        system.emitter = position.clone();
        system.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1);
        system.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
        
        system.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
        system.color2 = new BABYLON.Color4(1, 0.2, 0, 1);
        system.colorDead = new BABYLON.Color4(0.2, 0, 0, 0);
        
        system.minSize = 0.2;
        system.maxSize = 0.6;
        
        system.minLifeTime = 0.2;
        system.maxLifeTime = 0.6;
        
        system.emitRate = 300;
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        system.gravity = new BABYLON.Vector3(0, 5, 0);
        system.direction1 = new BABYLON.Vector3(-3, 2, -3);
        system.direction2 = new BABYLON.Vector3(3, 5, 3);
        
        system.minEmitPower = 4 * intensity;
        system.maxEmitPower = 6 * intensity;
        system.updateSpeed = 0.01;
        
        system.start();
        
        setTimeout(() => {
            system.stop();
        }, 150);
        
        const id = `fire_${Date.now()}`;
        this.emitters.set(id, { system, autoRemove: true });
        
        return id;
    }
    
    /**
     * Create spark effect (for metal impacts)
     */
    createSparks(position, direction, intensity = 1.0) {
        const system = new BABYLON.ParticleSystem("sparks", 30 * intensity, this.scene);
        system.particleTexture = this.textures.spark;
        
        system.emitter = position.clone();
        system.minEmitBox = new BABYLON.Vector3(-0.05, 0, -0.05);
        system.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05);
        
        system.color1 = new BABYLON.Color4(1, 0.9, 0.3, 1);
        system.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
        system.colorDead = new BABYLON.Color4(0.3, 0.1, 0, 0);
        
        system.minSize = 0.05;
        system.maxSize = 0.15;
        
        system.minLifeTime = 0.1;
        system.maxLifeTime = 0.4;
        
        system.emitRate = 200;
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        system.gravity = new BABYLON.Vector3(0, -9.81, 0);
        
        // Sparks fly in direction of impact
        const baseDir = direction.clone().normalize();
        system.direction1 = baseDir.scale(2).add(new BABYLON.Vector3(-1, 0, -1));
        system.direction2 = baseDir.scale(3).add(new BABYLON.Vector3(1, 2, 1));
        
        system.minEmitPower = 5 * intensity;
        system.maxEmitPower = 8 * intensity;
        system.updateSpeed = 0.01;
        
        system.start();
        
        setTimeout(() => {
            system.stop();
        }, 100);
        
        const id = `spark_${Date.now()}`;
        this.emitters.set(id, { system, autoRemove: true });
        
        return id;
    }
    
    /**
     * Create divine aura (for boons, special abilities)
     */
    createDivineAura(position, color = new BABYLON.Color4(1, 0.84, 0, 1), duration = null) {
        const system = new BABYLON.ParticleSystem("divineAura", 50, this.scene);
        system.particleTexture = this.textures.divine;
        
        system.emitter = position;
        system.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
        system.maxEmitBox = new BABYLON.Vector3(0.5, 1, 0.5);
        
        system.color1 = color.clone();
        system.color2 = color.clone();
        const fadeColor = color.clone();
        fadeColor.a = 0;
        system.colorDead = fadeColor;
        
        system.minSize = 0.1;
        system.maxSize = 0.3;
        
        system.minLifeTime = 1.0;
        system.maxLifeTime = 2.0;
        
        system.emitRate = 20;
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        system.gravity = new BABYLON.Vector3(0, 1, 0);
        system.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        system.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);
        
        system.minEmitPower = 0.5;
        system.maxEmitPower = 1;
        system.updateSpeed = 0.01;
        
        system.start();
        
        const id = `divine_${Date.now()}`;
        
        if (duration) {
            setTimeout(() => {
                this.removeEmitter(id);
            }, duration);
        }
        
        this.emitters.set(id, { system, autoRemove: duration !== null });
        
        return id;
    }
    
    /**
     * Create smoke trail (for dash, explosions)
     */
    createSmokeTrail(position, duration = 500) {
        const system = new BABYLON.ParticleSystem("smokeTrail", 30, this.scene);
        system.particleTexture = this.textures.smoke;
        
        system.emitter = position;
        system.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
        system.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
        
        system.color1 = new BABYLON.Color4(0.3, 0.1, 0.1, 0.5);
        system.color2 = new BABYLON.Color4(0.2, 0.05, 0.05, 0.3);
        system.colorDead = new BABYLON.Color4(0.1, 0, 0, 0);
        
        system.minSize = 0.3;
        system.maxSize = 0.8;
        
        system.minLifeTime = 0.5;
        system.maxLifeTime = 1.0;
        
        system.emitRate = 50;
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        
        system.gravity = new BABYLON.Vector3(0, 0.5, 0);
        system.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        system.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);
        
        system.minEmitPower = 0.2;
        system.maxEmitPower = 0.5;
        system.updateSpeed = 0.01;
        
        system.start();
        
        setTimeout(() => {
            system.stop();
        }, duration);
        
        const id = `smoke_${Date.now()}`;
        this.emitters.set(id, { system, autoRemove: true });
        
        return id;
    }
    
    /**
     * Remove an emitter
     */
    removeEmitter(id) {
        const emitter = this.emitters.get(id);
        if (emitter) {
            emitter.system.dispose();
            this.emitters.delete(id);
        }
    }
    
    /**
     * Clear all emitters
     */
    clearAll() {
        this.emitters.forEach((emitter) => {
            emitter.system.dispose();
        });
        this.emitters.clear();
    }
    
    // Texture creation helpers
    createBloodTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <circle cx="16" cy="16" r="12" fill="#800000" opacity="0.9"/>
                    <circle cx="16" cy="16" r="8" fill="#600000" opacity="0.8"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createFireTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <radialGradient id="fire">
                        <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
                        <stop offset="30%" stop-color="#ff6600" stop-opacity="0.9"/>
                        <stop offset="70%" stop-color="#ff0000" stop-opacity="0.5"/>
                        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                    </radialGradient>
                    <circle cx="16" cy="16" r="16" fill="url(#fire)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createSparkTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                    <radialGradient id="spark">
                        <stop offset="0%" stop-color="#ffffcc" stop-opacity="1"/>
                        <stop offset="50%" stop-color="#ffaa00" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                    </radialGradient>
                    <circle cx="8" cy="8" r="8" fill="url(#spark)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createSmokeTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                    <radialGradient id="smoke">
                        <stop offset="0%" stop-color="#333" stop-opacity="0.6"/>
                        <stop offset="70%" stop-color="#111" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                    </radialGradient>
                    <circle cx="32" cy="32" r="32" fill="url(#smoke)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
    
    createDivineTexture() {
        const texture = new BABYLON.Texture(
            "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                    <radialGradient id="divine">
                        <stop offset="0%" stop-color="#ffffcc" stop-opacity="1"/>
                        <stop offset="50%" stop-color="#ffd700" stop-opacity="0.7"/>
                        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
                    </radialGradient>
                    <circle cx="16" cy="16" r="16" fill="url(#divine)"/>
                </svg>
            `),
            this.scene
        );
        return texture;
    }
}
