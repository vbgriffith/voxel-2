/**
 * AudioSystem.js - Manages sound effects and music
 */
class AudioSystem {
    constructor(engine) {
        this.engine = engine;
        this.sounds = new Map();
        this.music = null;
        this.volume = { master: 0.7, sfx: 0.8, music: 0.5 };
        
        engine.registerSystem('audio', this);
        console.log('[AudioSystem] Initialized');
    }
    
    playSound(name, position = null, volume = 1.0) {
        // Simple beep for now - can be replaced with actual audio
        if (this.volume.master > 0 && this.volume.sfx > 0) {
            const finalVolume = this.volume.master * this.volume.sfx * volume;
            // Audio would play here
            this.engine.emit('audio:play', { name, volume: finalVolume });
        }
    }
    
    playMusic(name, loop = true) {
        this.engine.emit('audio:music', { name, loop });
    }
    
    stopMusic() {
        this.engine.emit('audio:music:stop');
    }
    
    setVolume(type, value) {
        if (this.volume.hasOwnProperty(type)) {
            this.volume[type] = Math.max(0, Math.min(1, value));
        }
    }
}
