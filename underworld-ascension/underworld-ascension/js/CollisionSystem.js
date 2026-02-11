/**
 * CollisionSystem.js - Handles all collision detection and resolution
 */
class CollisionSystem {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        // Collision layers
        this.layers = {
            player: [],
            enemies: [],
            projectiles: [],
            enemyProjectiles: [],
            walls: [],
            obstacles: []
        };
        
        // Spatial grid for optimization
        this.gridSize = 5;
        this.grid = new Map();
        
        engine.registerSystem('collision', this);
        engine.on('engine:update', (data) => this.update());
        
        console.log('[CollisionSystem] Initialized');
    }
    
    /**
     * Register a collidable object
     */
    register(object, layer) {
        if (!this.layers[layer]) this.layers[layer] = [];
        this.layers[layer].push(object);
        this.updateGrid(object);
    }
    
    /**
     * Unregister a collidable object
     */
    unregister(object, layer) {
        if (this.layers[layer]) {
            const index = this.layers[layer].indexOf(object);
            if (index > -1) {
                this.layers[layer].splice(index, 1);
            }
        }
    }
    
    /**
     * Update collision grid
     */
    updateGrid(object) {
        if (!object.position) return;
        
        const gridX = Math.floor(object.position.x / this.gridSize);
        const gridZ = Math.floor(object.position.z / this.gridSize);
        const key = `${gridX},${gridZ}`;
        
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        
        if (!this.grid.get(key).includes(object)) {
            this.grid.get(key).push(object);
        }
    }
    
    /**
     * Check circle-circle collision
     */
    checkCircleCollision(pos1, radius1, pos2, radius2) {
        const dx = pos2.x - pos1.x;
        const dz = pos2.z - pos1.z;
        const distSq = dx * dx + dz * dz;
        const radiusSum = radius1 + radius2;
        
        return distSq < radiusSum * radiusSum;
    }
    
    /**
     * Check if point is inside bounds
     */
    isInBounds(position, bounds) {
        return position.x >= bounds.minX && 
               position.x <= bounds.maxX &&
               position.z >= bounds.minZ &&
               position.z <= bounds.maxZ;
    }
    
    /**
     * Resolve collision between two objects
     */
    resolveCollision(obj1, obj2) {
        const dx = obj2.position.x - obj1.position.x;
        const dz = obj2.position.z - obj1.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist === 0) return;
        
        const overlap = (obj1.radius + obj2.radius) - dist;
        const nx = dx / dist;
        const nz = dz / dist;
        
        // Push objects apart
        if (obj1.pushable) {
            obj1.position.x -= nx * overlap * 0.5;
            obj1.position.z -= nz * overlap * 0.5;
        }
        
        if (obj2.pushable) {
            obj2.position.x += nx * overlap * 0.5;
            obj2.position.z += nz * overlap * 0.5;
        }
    }
    
    /**
     * Check collision between layers
     */
    checkLayerCollision(layer1Name, layer2Name, callback) {
        const layer1 = this.layers[layer1Name];
        const layer2 = this.layers[layer2Name];
        
        if (!layer1 || !layer2) return;
        
        for (const obj1 of layer1) {
            for (const obj2 of layer2) {
                if (obj1.active && obj2.active && 
                    this.checkCircleCollision(
                        obj1.position, obj1.radius,
                        obj2.position, obj2.radius
                    )) {
                    callback(obj1, obj2);
                }
            }
        }
    }
    
    /**
     * Get nearby objects
     */
    getNearby(position, radius) {
        const nearby = [];
        const gridX = Math.floor(position.x / this.gridSize);
        const gridZ = Math.floor(position.z / this.gridSize);
        
        // Check surrounding grid cells
        for (let x = gridX - 1; x <= gridX + 1; x++) {
            for (let z = gridZ - 1; z <= gridZ + 1; z++) {
                const key = `${x},${z}`;
                const cell = this.grid.get(key);
                if (cell) {
                    nearby.push(...cell);
                }
            }
        }
        
        return nearby.filter(obj => {
            const dx = obj.position.x - position.x;
            const dz = obj.position.z - position.z;
            return Math.sqrt(dx * dx + dz * dz) <= radius;
        });
    }
    
    /**
     * Raycast from position in direction
     */
    raycast(origin, direction, maxDistance = 100, layerName = null) {
        const layers = layerName ? [this.layers[layerName]] : Object.values(this.layers);
        let closest = null;
        let closestDist = maxDistance;
        
        for (const layer of layers) {
            if (!layer) continue;
            
            for (const obj of layer) {
                if (!obj.active || !obj.position) continue;
                
                // Simple sphere raycast
                const toObj = obj.position.subtract(origin);
                const proj = BABYLON.Vector3.Dot(toObj, direction);
                
                if (proj < 0 || proj > maxDistance) continue;
                
                const closestPoint = origin.add(direction.scale(proj));
                const dist = BABYLON.Vector3.Distance(closestPoint, obj.position);
                
                if (dist <= obj.radius && proj < closestDist) {
                    closestDist = proj;
                    closest = obj;
                }
            }
        }
        
        return closest ? { object: closest, distance: closestDist } : null;
    }
    
    /**
     * Update collision system
     */
    update() {
        // Rebuild spatial grid
        this.grid.clear();
        
        for (const layerName in this.layers) {
            for (const obj of this.layers[layerName]) {
                if (obj.active && obj.position) {
                    this.updateGrid(obj);
                }
            }
        }
    }
    
    /**
     * Clear all colliders
     */
    clear() {
        for (const layerName in this.layers) {
            this.layers[layerName] = [];
        }
        this.grid.clear();
    }
}
