/**
 * ChestSystem.js - Chests with rewards
 */
class ChestSystem {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.chests = [];
        
        engine.registerSystem('chests', this);
        console.log('[ChestSystem] Initialized');
    }
    
    createChest(position) {
        const chest = BABYLON.MeshBuilder.CreateBox('chest', {
            width: 1.5, height: 1, depth: 1
        }, this.scene);
        chest.position = position;
        
        const mat = new BABYLON.StandardMaterial('chestMat', this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0.2);
        chest.material = mat;
        
        const chestObj = {
            mesh: chest,
            position: position,
            opened: false,
            reward: this.generateReward()
        };
        
        this.chests.push(chestObj);
        return chestObj;
    }
    
    generateReward() {
        const roll = Math.random();
        if (roll < 0.5) return { type: 'darkness', amount: 50 };
        if (roll < 0.8) return { type: 'gems', amount: 10 };
        return { type: 'boon', rarity: 'rare' };
    }
    
    openChest(chestObj) {
        if (chestObj.opened) return null;
        
        chestObj.opened = true;
        chestObj.mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        this.engine.emit('chest:opened', { reward: chestObj.reward });
        return chestObj.reward;
    }
    
    getNearbyChest(position, radius = 3) {
        for (const chest of this.chests) {
            if (!chest.opened && BABYLON.Vector3.Distance(position, chest.position) < radius) {
                return chest;
            }
        }
        return null;
    }
    
    clearAllChests() {
        this.chests.forEach(c => c.mesh.dispose());
        this.chests = [];
    }
}
