/**
 * HazardSystem.js - Phase 5
 * Pits, spike traps, fire vents. Damages player on contact.
 */
class HazardSystem {
    constructor(engine) {
        this.engine   = engine;
        this.hazards  = [];
        this.scene    = engine.scene;
        this._tick    = 0;

        engine.registerSystem('hazards', this);
        console.log('[HazardSystem] Initialized');
    }

    // ── Public API ──────────────────────────────────────────────────────────

    spawnHazardsForRoom(roomType, roomSize) {
        this.clearAll();
        if (roomType !== 'battle' && roomType !== 'boss') return;

        const count = roomType === 'boss' ? 4 : 3 + Math.floor(Math.random() * 3);
        const half  = Math.min(roomSize.width, roomSize.depth) / 2 - 5;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const r     = (4 + Math.random() * (half - 4));
            const x     = Math.cos(angle) * r;
            const z     = Math.sin(angle) * r;

            const type  = Math.random() < 0.4 ? 'pit' : (Math.random() < 0.5 ? 'spikes' : 'fire');
            this.createHazard(type, new BABYLON.Vector3(x, 0, z));
        }
    }

    createHazard(type, position) {
        switch (type) {
            case 'pit':    return this._makePit(position);
            case 'spikes': return this._makeSpikes(position);
            case 'fire':   return this._makeFire(position);
        }
    }

    update(dt, playerPos) {
        if (!playerPos) return;
        this._tick++;

        this.hazards.forEach(h => {
            if (!h.active) return;

            // Per-type tick
            if (h.type === 'spikes') this._tickSpikes(h);
            if (h.type === 'fire')   this._tickFire(h);

            // Collision with player
            const dist = BABYLON.Vector3.Distance(playerPos, h.position);
            if (dist < h.radius && h.dealsDamage) {
                this.engine.emit('hazard:hit', { type: h.type, damage: h.damage });
            }
        });
    }

    clearAll() {
        this.hazards.forEach(h => {
            if (h.mesh)  h.mesh.dispose();
            if (h.mesh2) h.mesh2.dispose();
        });
        this.hazards = [];
    }

    // ── Hazard constructors ────────────────────────────────────────────────

    _makePit(position) {
        // Dark recessed circle — kill zone
        const pit = BABYLON.MeshBuilder.CreateCylinder('pit', {
            height: 0.3, diameter: 3.5, tessellation: 20
        }, this.scene);
        pit.position  = position.clone();
        pit.position.y = -0.15;

        const mat = new BABYLON.StandardMaterial('pitMat', this.scene);
        mat.diffuseColor  = new BABYLON.Color3(0.05, 0.05, 0.05);
        mat.emissiveColor = new BABYLON.Color3(0.1, 0, 0);
        pit.material = mat;

        const h = { type:'pit', mesh:pit, position: position.clone(), radius:1.6, damage:9999, dealsDamage:true, active:true };
        this.hazards.push(h);
        return h;
    }

    _makeSpikes(position) {
        // Retractable spikes that pulse
        const base = BABYLON.MeshBuilder.CreateCylinder('spikeBase', {
            height:0.1, diameter:2.5, tessellation:12
        }, this.scene);
        base.position = position.clone();

        const mat = new BABYLON.StandardMaterial('spikeMat', this.scene);
        mat.diffuseColor  = new BABYLON.Color3(0.5, 0.4, 0.3);
        mat.emissiveColor = new BABYLON.Color3(0.2, 0.0, 0.0);
        base.material = mat;

        // Spike tips (visible only when up)
        const tips = BABYLON.MeshBuilder.CreateCylinder('spikeTips', {
            height:0.8, diameterTop:0, diameterBottom:0.15, tessellation:8
        }, this.scene);
        tips.position = position.clone();
        tips.position.y = 0.3;
        tips.material = mat;

        let phase = 0, up = false;
        const h = {
            type:'spikes', mesh:base, mesh2:tips,
            position: position.clone(), radius:1.2, damage:20,
            dealsDamage:false, active:true,
            phase:0, up:false,
            tick() {
                this.phase++;
                if (this.phase % 90 === 0) {
                    this.up = !this.up;
                    tips.position.y = this.up ? 0.6 : -0.5;
                    mat.emissiveColor = this.up
                        ? new BABYLON.Color3(0.8, 0.0, 0.0)
                        : new BABYLON.Color3(0.2, 0.0, 0.0);
                    this.dealsDamage = this.up;
                }
            }
        };
        this.hazards.push(h);
        return h;
    }

    _makeFire(position) {
        // Static fire vent
        const base = BABYLON.MeshBuilder.CreateCylinder('fireBase', {
            height:0.2, diameter:1.5, tessellation:10
        }, this.scene);
        base.position = position.clone();

        const mat = new BABYLON.StandardMaterial('fireMat', this.scene);
        mat.diffuseColor  = new BABYLON.Color3(0.8, 0.3, 0.0);
        mat.emissiveColor = new BABYLON.Color3(1.0, 0.5, 0.0);
        base.material = mat;

        // Pulsing glow
        let phase = 0;
        const h = {
            type:'fire', mesh:base, mesh2:null,
            position: position.clone(), radius:1.0, damage:12,
            dealsDamage:true, active:true,
            phase:0,
            tick() {
                this.phase++;
                const pulse = 0.5 + 0.5 * Math.sin(this.phase * 0.15);
                mat.emissiveColor = new BABYLON.Color3(pulse, pulse * 0.4, 0);
            }
        };
        this.hazards.push(h);
        return h;
    }

    _tickSpikes(h) { if (h.tick) h.tick(); }
    _tickFire(h)   { if (h.tick) h.tick(); }
}
