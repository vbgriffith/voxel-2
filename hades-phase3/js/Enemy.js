/**
 * Enemy.js — Entity, delegates AI to EnemyBrain via SwarmManager (Phase 3)
 */
class Enemy {
    constructor(engine, type, position) {
        this.engine   = engine;
        this.scene    = engine.scene;
        this.type     = type;
        this.id       = `enemy_${type}_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;

        const hpMap   = { grunt:50, fast:30, tank:120, ranged:40 };
        const cfg     = (typeof AIConfig !== 'undefined' && AIConfig[type]) ? AIConfig[type] : {};
        this.maxHealth= hpMap[type] || 60;
        this.health   = this.maxHealth;
        this.damage   = cfg.damage  || 10;
        this.speed    = cfg.speed   || 0.09;

        this.position = position.clone();
        this.velocity = new BABYLON.Vector3(0,0,0);
        this.active   = true;
        this.radius   = type === 'tank' ? 0.7 : 0.5;
        this.pushable = true;
        this.brain    = null;
        this.rig      = null;
        this.mesh     = null;
        this.healthBar= null;

        this.createCharacter();
        this.createHealthBar();

        const col = engine.getSystem('collision');
        if (col) col.register(this, 'enemies');

        engine.emit('enemy:registered', { enemy: this });
    }

    createCharacter() {
        const typeColors = {
            grunt:  new BABYLON.Color3(0.85, 0.2,  0.2),
            fast:   new BABYLON.Color3(1.0,  0.55, 0.1),
            tank:   new BABYLON.Color3(0.5,  0.1,  0.6),
            ranged: new BABYLON.Color3(0.2,  0.75, 0.3)
        };
        const col = typeColors[this.type] || new BABYLON.Color3(0.8,0.2,0.2);

        if (typeof CharacterRig !== 'undefined') {
            this.rig = new CharacterRig(this.engine, this.id);
            this.rig.setPosition(this.position.x, this.position.y, this.position.z);
            this.rig.getRootNode().getChildMeshes().forEach(m => {
                if (m.material) {
                    m.material.diffuseColor  = col;
                    m.material.emissiveColor = col.scale(0.25);
                }
            });
            this.mesh = this.rig.getRootNode();
        } else {
            this.mesh = BABYLON.MeshBuilder.CreateCylinder(this.id,
                { height:1.8, diameter: this.type==='tank' ? 1.3 : 0.9 }, this.scene);
            this.mesh.position = this.position.clone();
            const mat = new BABYLON.StandardMaterial(`${this.id}_mat`, this.scene);
            mat.diffuseColor = col; mat.emissiveColor = col.scale(0.25);
            this.mesh.material = mat;
        }

        if (this.type === 'tank'   && this.rig) this.rig.getRootNode().scaling = new BABYLON.Vector3(1.4,1.4,1.4);
        if (this.type === 'ranged' && this.rig) this.rig.getRootNode().scaling = new BABYLON.Vector3(0.85,0.85,0.85);
    }

    createHealthBar() {
        const bar = BABYLON.MeshBuilder.CreatePlane(`${this.id}_hpbar`,
            { width:1.2, height:0.18 }, this.scene);
        bar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        bar.position = this.position.clone(); bar.position.y += 2.6;
        bar.parent   = this.mesh;
        const mat = new BABYLON.StandardMaterial(`${this.id}_hpmat`, this.scene);
        mat.diffuseColor = mat.emissiveColor = new BABYLON.Color3(0.1,0.9,0.1);
        mat.backFaceCulling = false;
        bar.material = mat;
        this.healthBar = bar;
    }

    updateHealthBar() {
        if (!this.healthBar) return;
        const p = Math.max(0, this.health / this.maxHealth);
        this.healthBar.material.diffuseColor  = new BABYLON.Color3(1-p, p, 0.05);
        this.healthBar.material.emissiveColor = new BABYLON.Color3((1-p)*0.5, p*0.5, 0.05);
        this.healthBar.scaling.x = p;
    }

    update(deltaTime) {
        if (!this.active) return;
        this.updateHealthBar();
    }

    takeDamage(amount) {
        if (!this.active) return;
        this.health -= amount;

        // Flash white
        const meshes = this.mesh
            ? (this.mesh.getChildMeshes ? this.mesh.getChildMeshes() : [this.mesh]) : [];
        meshes.forEach(m => {
            if (!m.material) return;
            const orig = m.material.emissiveColor.clone();
            m.material.emissiveColor = new BABYLON.Color3(1,1,1);
            setTimeout(() => { if (m.material) m.material.emissiveColor = orig; }, 80);
        });

        const particles = this.engine.getSystem('particle');
        if (particles) particles.createBloodSplatter(this.position.clone(), 0.6);

        const anim = this.engine.getSystem('animation');
        if (anim) anim.playHit(this);

        const swarm = this.engine.getSystem('swarm');
        if (swarm) swarm.broadcastAlert(this, this.position);

        if (this.health <= 0) this.die();
    }

    die() {
        this.active = false;

        const particles = this.engine.getSystem('particle');
        if (particles) particles.createFireBurst(this.position.clone(), 1.2);

        this.engine.emit('currency:drop', {
            position: this.position.clone(),
            type:   this.type === 'tank' ? 'gems' : 'darkness',
            amount: { grunt:8, fast:12, tank:35, ranged:15 }[this.type] || 10
        });

        setTimeout(() => {
            if (this.healthBar) this.healthBar.dispose();
            if (this.rig)        this.rig.dispose();
            else if (this.mesh)  this.mesh.dispose();
        }, 400);

        const col = this.engine.getSystem('collision');
        if (col) col.unregister(this, 'enemies');

        this.engine.emit('enemy:death', { enemy: this });
    }

    dispose() {
        this.active = false;
        if (this.healthBar) this.healthBar.dispose();
        if (this.rig)        this.rig.dispose();
        else if (this.mesh)  this.mesh.dispose();
        const col = this.engine.getSystem('collision');
        if (col) col.unregister(this, 'enemies');
    }
}
