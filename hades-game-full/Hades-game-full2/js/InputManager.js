class InputManager {
    constructor(engine) {
        this.engine = engine;
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false, worldPos: null };
        this.setupListeners();
        engine.registerSystem('input', this);
        console.log('[InputManager] Initialized');
    }
    
    setupListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.engine.emit('input:keydown', { key: e.key.toLowerCase() });
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.engine.emit('input:keyup', { key: e.key.toLowerCase() });
        });
        
        this.engine.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.engine.emit('input:mousedown', { button: e.button });
        });
        
        this.engine.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.engine.emit('input:mouseup', { button: e.button });
        });
        
        this.engine.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.updateWorldPosition();
        });
    }
    
    updateWorldPosition() {
        const pickInfo = this.engine.scene.pick(this.mouse.x, this.mouse.y, (mesh) => {
            return mesh.name === "ground";
        });
        
        if (pickInfo.hit) {
            this.mouse.worldPos = pickInfo.pickedPoint;
        }
    }
    
    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }
    
    getMovementVector() {
        let x = 0, z = 0;
        if (this.isKeyDown('w')) z += 1;
        if (this.isKeyDown('s')) z -= 1;
        if (this.isKeyDown('a')) x -= 1;
        if (this.isKeyDown('d')) x += 1;
        
        if (x !== 0 || z !== 0) {
            const len = Math.sqrt(x*x + z*z);
            x /= len;
            z /= len;
        }
        
        return { x, z };
    }
}
