/**
 * CameraController.js - Camera locked to player, no manual control
 */

class CameraController {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.camera = null;
        this.target = null;
        
        // Camera settings
        this.offset = new BABYLON.Vector3(0, 20, -15); // Isometric-like
        this.smoothing = 0.1; // Camera smoothing factor
        this.locked = true; // Always locked to player
        
        engine.registerSystem('camera', this);
        this.setupCamera();
        
        console.log('[CameraController] Camera locked to player');
    }
    
    /**
     * Setup camera
     */
    setupCamera() {
        // Reuse Engine's ArcRotateCamera and override its target each frame
        // so we get a free-follow isometric camera locked to the player
        this.camera = this.scene.activeCamera;
        if (!this.camera) {
            this.camera = new BABYLON.UniversalCamera(
                'playerCamera',
                new BABYLON.Vector3(0, 20, -15),
                this.scene
            );
            this.scene.activeCamera = this.camera;
        }
        // Detach all user input from the camera
        this.camera.detachControl(this.engine.canvas);
    }
    
    /**
     * Set target to follow (usually player)
     */
    setTarget(target) {
        this.target = target;
    }
    
    /**
     * Update camera position
     */
    update(deltaTime) {
        if (!this.target || !this.locked || !this.camera) return;
        
        const targetPosition = this.target.position || this.target;
        
        // ArcRotateCamera: just move its target
        if (this.camera instanceof BABYLON.ArcRotateCamera) {
            this.camera.target = BABYLON.Vector3.Lerp(
                this.camera.target,
                targetPosition,
                this.smoothing * 2
            );
        } else {
            // UniversalCamera
            const desired = targetPosition.add(this.offset);
            this.camera.position = BABYLON.Vector3.Lerp(
                this.camera.position, desired, this.smoothing
            );
            this.camera.setTarget(targetPosition);
        }
    }
    
    /**
     * Shake camera (for impacts, explosions)
     */
    shake(intensity = 1.0, duration = 0.3) {
        const originalPos = this.camera.position.clone();
        const startTime = Date.now();
        const durationMs = duration * 1000;
        
        const shakeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const t = elapsed / durationMs;
            
            if (t >= 1.0) {
                clearInterval(shakeInterval);
                this.camera.position = originalPos;
                return;
            }
            
            // Shake decreases over time
            const shake = intensity * (1 - t);
            const offsetX = (Math.random() - 0.5) * shake;
            const offsetY = (Math.random() - 0.5) * shake;
            const offsetZ = (Math.random() - 0.5) * shake;
            
            this.camera.position.x = originalPos.x + offsetX;
            this.camera.position.y = originalPos.y + offsetY;
            this.camera.position.z = originalPos.z + offsetZ;
        }, 16); // ~60fps
    }
    
    /**
     * Zoom in/out (for dramatic moments)
     */
    zoom(targetFOV, duration = 1.0) {
        const startFOV = this.camera.fov;
        const startTime = Date.now();
        const durationMs = duration * 1000;
        
        const zoomInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const t = elapsed / durationMs;
            
            if (t >= 1.0) {
                clearInterval(zoomInterval);
                this.camera.fov = targetFOV;
                return;
            }
            
            // Smooth zoom
            const eased = this.easeInOutCubic(t);
            this.camera.fov = BABYLON.Scalar.Lerp(startFOV, targetFOV, eased);
        }, 16);
    }
    
    /**
     * Reset camera to default position
     */
    reset() {
        this.camera.position = this.offset.clone();
        this.camera.rotation = new BABYLON.Vector3(Math.PI / 4, 0, 0);
        this.camera.fov = 0.8;
    }
    
    /**
     * Change camera offset (for different room sizes)
     */
    setOffset(x, y, z) {
        this.offset = new BABYLON.Vector3(x, y, z);
    }
    
    /**
     * Easing function
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Lock/unlock camera (always locked in this game)
     */
    setLocked(locked) {
        this.locked = locked;
        if (!locked) {
            console.warn('[CameraController] Camera should remain locked in this game');
        }
    }
}
