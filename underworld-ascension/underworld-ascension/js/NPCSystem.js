/**
 * NPCSystem.js - Phase 4
 * NPC placement, proximity interaction, visual representation.
 */
class NPCSystem {
    constructor(engine) {
        this.engine = engine;
        this.npcs   = [];

        // NPC definitions per room type
        this.npcDefs = {
            hub: [
                { id:'hades',    name:'Hades',    pos:[-12, 0, -10], color:[0.5,0.0,0.0] },
                { id:'nyx',      name:'Nyx',      pos:[ 12, 0, -10], color:[0.2,0.0,0.4] },
                { id:'achilles', name:'Achilles', pos:[  0, 0, -14], color:[0.6,0.5,0.1] },
                { id:'merchant', name:'Charon',   pos:[-14, 0,   4], color:[0.2,0.2,0.2] },
            ],
            rest: [
                { id:'achilles', name:'Achilles', pos:[  0, 0, -8], color:[0.6,0.5,0.1] },
            ]
        };

        engine.registerSystem('npc', this);
        engine.on('room:created', d => this.spawnForRoom(d.type));
        console.log('[NPCSystem] Initialized');
    }

    spawnForRoom(roomType) {
        this.clearAll();
        const defs = this.npcDefs[roomType];
        if (!defs) return;
        defs.forEach(d => this.createNPC(d));
    }

    createNPC(def) {
        const scene = this.engine.scene;

        // Body
        const root  = new BABYLON.TransformNode(`npc_${def.id}`, scene);
        root.position = new BABYLON.Vector3(...def.pos);

        const body  = BABYLON.MeshBuilder.CreateCapsule(`${def.id}_body`, { height:1.6, radius:0.32 }, scene);
        body.position.y = 0.8;
        body.parent  = root;

        const mat    = new BABYLON.StandardMaterial(`${def.id}_mat`, scene);
        mat.diffuseColor  = new BABYLON.Color3(...def.color);
        mat.emissiveColor = new BABYLON.Color3(...def.color.map(c => c * 0.4));
        body.material = mat;

        const head  = BABYLON.MeshBuilder.CreateSphere(`${def.id}_head`, { diameter:0.5 }, scene);
        head.position.y = 2.1;
        head.parent  = root;
        head.material = mat;

        // Name label plane (billboard)
        const label  = BABYLON.MeshBuilder.CreatePlane(`${def.id}_label`, { width:2, height:0.4 }, scene);
        label.position = new BABYLON.Vector3(0, 2.8, 0);
        label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        label.parent = root;
        const lmat   = new BABYLON.StandardMaterial(`${def.id}_lmat`, scene);
        lmat.diffuseColor  = new BABYLON.Color3(1, 0.85, 0.3);
        lmat.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0.1);
        lmat.backFaceCulling = false;
        label.material = lmat;

        // Gentle bob animation
        let t = 0;
        const bobObs = this.engine.scene.onBeforeRenderObservable.add(() => {
            t += 0.03;
            root.position.y = Math.sin(t) * 0.06;
        });

        const npc = {
            id:       def.id,
            name:     def.name,
            root,
            body,
            head,
            label,
            position: root.position,
            bobObs,
            radius:   0.8,
            interacted: false
        };
        this.npcs.push(npc);
        return npc;
    }

    getNearby(playerPos, radius = 3.5) {
        for (const npc of this.npcs) {
            if (BABYLON.Vector3.Distance(playerPos, npc.position) <= radius) return npc;
        }
        return null;
    }

    interact(npc) {
        const dialogue = this.engine.getSystem('dialogue');
        if (dialogue && !dialogue.isActive()) {
            dialogue.start(npc.id);
        }
    }

    clearAll() {
        this.npcs.forEach(npc => {
            this.engine.scene.onBeforeRenderObservable.remove(npc.bobObs);
            npc.body.dispose();
            npc.head.dispose();
            npc.label.dispose();
            npc.root.dispose();
        });
        this.npcs = [];
    }
}
