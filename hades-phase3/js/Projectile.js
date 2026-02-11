/**
 * Projectile.js - Simple projectile system
 */
class Projectile {
    constructor(engine, data) {
        this.engine = engine;
        this.scene = engine.scene;
        
        this.position = data.position.clone();
        this.damage = data.damage;
        this.speed = data.speed || 0.5;
        this.lifetime = data.lifetime || 120;
        this.radius = data.radius || 0.25;
        this.color  = data.color || new BABYLON.Color3(1, 1, 0);
        this.team   = data.team  || 'player';
        
        const angle = data.rotation;
        this.velocity = new BABYLON.Vector3(
            Math.sin(angle) * this.speed,
            0,
            Math.cos(angle) * this.speed
        );
        
        this.active = true;
        this.hit = false;
        
        this.createMesh();
        
        const collision = engine.getSystem('collision');
        const layer = this.team === 'enemy' ? 'enemyProjectiles' : 'projectiles';
        if (collision) collision.register(this, layer);
    }
    
    createMesh() {
        this.mesh = BABYLON.MeshBuilder.CreateSphere('projectile', {
            diameter: this.radius * 2
        }, this.scene);
        this.mesh.position = this.position;
        
        const mat = new BABYLON.StandardMaterial('projMat', this.scene);
        mat.diffuseColor = this.color;
        mat.emissiveColor = this.color.scale(0.8);
        this.mesh.material = mat;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.position.addInPlace(this.velocity);
        this.mesh.position.copyFrom(this.position);
        
        this.lifetime--;
        if (this.lifetime <= 0 || this.hit) {
            this.destroy();
        }
    }
    
    onHit() {
        this.hit = true;
        const particles = this.engine.getSystem('particle');
        if (particles) {
            particles.createSparks(this.position.clone(), this.velocity.negate(), 0.5);
        }
    }
    
    destroy() {
        this.active = false;
        if (this.mesh) {
            this.mesh.dispose();
        }
        
        const collision = this.engine.getSystem('collision');
        const layer = this.team === 'enemy' ? 'enemyProjectiles' : 'projectiles';
        if (collision) collision.unregister(this, layer);
    }
}
