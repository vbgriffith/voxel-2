/**
 * DoorSystem.js - Manages doors that lock/unlock
 * Different visual styles for different room types
 */

class DoorSystem {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        this.doors = [];
        
        // Door type configurations
        this.doorStyles = {
            locked: {
                color: new BABYLON.Color3(0.6, 0.1, 0.1),
                emissive: new BABYLON.Color3(0.3, 0.05, 0.05),
                symbol: '🔒',
                canPass: false
            },
            open: {
                color: new BABYLON.Color3(0.2, 0.6, 0.3),
                emissive: new BABYLON.Color3(0.1, 0.3, 0.15),
                symbol: '✓',
                canPass: true
            },
            boss: {
                color: new BABYLON.Color3(0.8, 0.1, 0.1),
                emissive: new BABYLON.Color3(0.5, 0.05, 0.05),
                symbol: '⚠️',
                canPass: false
            },
            final: {
                color: new BABYLON.Color3(0.9, 0.8, 0.2),
                emissive: new BABYLON.Color3(0.7, 0.6, 0.1),
                symbol: '👑',
                canPass: false
            }
        };
        
        engine.registerSystem('doors', this);
        console.log('[DoorSystem] Initialized');
    }
    
    /**
     * Create a door
     */
    createDoor(position, type = 'locked') {
        const style = this.doorStyles[type] || this.doorStyles.locked;
        
        // Door frame
        const frame = BABYLON.MeshBuilder.CreateBox('doorFrame', {
            width: 4,
            height: 5,
            depth: 0.5
        }, this.scene);
        frame.position = position.clone();
        
        const frameMat = new BABYLON.StandardMaterial('doorFrameMat', this.scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.25);
        frame.material = frameMat;
        
        // Door itself
        const door = BABYLON.MeshBuilder.CreateBox('door', {
            width: 3.5,
            height: 4.5,
            depth: 0.3
        }, this.scene);
        door.position = position.clone();
        door.position.z += 0.1;
        
        const doorMat = new BABYLON.StandardMaterial('doorMat', this.scene);
        doorMat.diffuseColor = style.color;
        doorMat.emissiveColor = style.emissive;
        doorMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        door.material = doorMat;
        
        // Lock indicator
        const lockPlane = BABYLON.MeshBuilder.CreatePlane('lockIndicator', {
            width: 1,
            height: 1
        }, this.scene);
        lockPlane.position = position.clone();
        lockPlane.position.z += 0.4;
        lockPlane.position.y += 1;
        
        const lockMat = new BABYLON.StandardMaterial('lockMat', this.scene);
        lockMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        lockMat.emissiveColor = style.emissive.scale(2);
        lockPlane.material = lockMat;
        
        // Door object
        const doorObj = {
            frame: frame,
            door: door,
            lockIndicator: lockPlane,
            position: position,
            type: type,
            locked: !style.canPass,
            style: style,
            id: `door_${Date.now()}_${Math.random()}`
        };
        
        this.doors.push(doorObj);
        
        // Make door glow if locked
        if (doorObj.locked) {
            this.addLockedGlow(door);
        }
        
        return doorObj;
    }
    
    /**
     * Add glowing effect to locked door
     */
    addLockedGlow(doorMesh) {
        const glowLayer = this.scene.getGlowLayerByName('glow');
        if (glowLayer) {
            glowLayer.addIncludedOnlyMesh(doorMesh);
        }
    }
    
    /**
     * Remove glow effect
     */
    removeGlow(doorMesh) {
        const glowLayer = this.scene.getGlowLayerByName('glow');
        if (glowLayer) {
            glowLayer.removeIncludedOnlyMesh(doorMesh);
        }
    }
    
    /**
     * Unlock a door
     */
    unlockDoor(doorObj) {
        if (!doorObj.locked) return;
        
        doorObj.locked = false;
        
        // Change visual to unlocked
        const openStyle = this.doorStyles.open;
        doorObj.door.material.diffuseColor = openStyle.color;
        doorObj.door.material.emissiveColor = openStyle.emissive;
        
        // Remove glow
        this.removeGlow(doorObj.door);
        
        // Animate door opening
        this.animateDoorOpen(doorObj);
        
        // Emit event
        this.engine.emit('door:unlocked', { door: doorObj });
        
        console.log('[DoorSystem] Door unlocked');
    }
    
    /**
     * Lock a door
     */
    lockDoor(doorObj) {
        if (doorObj.locked) return;
        
        doorObj.locked = true;
        
        // Change visual to locked
        const lockedStyle = this.doorStyles.locked;
        doorObj.door.material.diffuseColor = lockedStyle.color;
        doorObj.door.material.emissiveColor = lockedStyle.emissive;
        
        // Add glow
        this.addLockedGlow(doorObj.door);
        
        // Emit event
        this.engine.emit('door:locked', { door: doorObj });
    }
    
    /**
     * Animate door opening
     */
    animateDoorOpen(doorObj) {
        const door = doorObj.door;
        const startPos = door.position.clone();
        const targetPos = startPos.clone();
        targetPos.y += 4; // Slide up
        
        const animationDuration = 60; // frames
        let frame = 0;
        
        const animate = () => {
            frame++;
            const t = frame / animationDuration;
            const eased = this.easeOutCubic(t);
            
            door.position.y = BABYLON.Scalar.Lerp(startPos.y, targetPos.y, eased);
            
            if (frame < animationDuration) {
                requestAnimationFrame(animate);
            } else {
                // Hide door completely
                door.setEnabled(false);
            }
        };
        
        animate();
    }
    
    /**
     * Check if player can pass through door
     */
    canPassThrough(doorObj, playerPosition) {
        if (doorObj.locked) {
            // Show message that door is locked
            this.engine.emit('door:blocked', { door: doorObj });
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if player is near any door
     */
    getNearbyDoor(playerPosition, radius = 3) {
        for (const door of this.doors) {
            const distance = BABYLON.Vector3.Distance(playerPosition, door.position);
            if (distance < radius) {
                return door;
            }
        }
        return null;
    }
    
    /**
     * Trigger door transition (to next room)
     */
    triggerDoorTransition(doorObj) {
        if (doorObj.locked) {
            console.log('[DoorSystem] Cannot use locked door');
            return false;
        }
        
        // Emit transition event
        this.engine.emit('door:transition', { door: doorObj });
        
        return true;
    }
    
    /**
     * Easing function for animations
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    /**
     * Clear all doors
     */
    clearAllDoors() {
        this.doors.forEach(doorObj => {
            if (doorObj.frame) doorObj.frame.dispose();
            if (doorObj.door) doorObj.door.dispose();
            if (doorObj.lockIndicator) doorObj.lockIndicator.dispose();
        });
        
        this.doors = [];
    }
    
    /**
     * Get all locked doors
     */
    getLockedDoors() {
        return this.doors.filter(d => d.locked);
    }
    
    /**
     * Unlock all doors in current room
     */
    unlockAllDoors() {
        this.doors.forEach(door => {
            if (door.locked) {
                this.unlockDoor(door);
            }
        });
    }
}
