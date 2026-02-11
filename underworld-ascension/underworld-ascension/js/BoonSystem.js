/**
 * BoonSystem.js - Phase 4/5
 * Divine boons from the Olympians. Applied after each room clear.
 */
class BoonSystem {
    constructor(engine) {
        this.engine      = engine;
        this.activeBoons = [];

        this.catalog = [
            // ── Ares ────────────────────────────────────────────────────────
            { id:'ares_blade',   god:'Ares',      name:'Blade Rift',      desc:'+50% Attack Damage',       color:'#cc2200', emoji:'⚔️',  apply: p => { p.damage = Math.floor(p.damage * 1.5); } },
            { id:'ares_blood',   god:'Ares',      name:'Blood Price',     desc:'Kills heal 5 HP',          color:'#cc2200', emoji:'⚔️',  apply: () => {} }, // handled in game loop
            { id:'ares_rupture', god:'Ares',      name:'Rupture',         desc:'Attacks cause bleed (+5/s)', color:'#cc2200', emoji:'⚔️', apply: () => {} },

            // ── Aphrodite ─────────────────────────────────────────────────
            { id:'aph_life',     god:'Aphrodite', name:'Life Affirmation',desc:'+30 Max HP + full heal',   color:'#ff69b4', emoji:'💖',  apply: p => { p.maxHealth += 30; p.health = p.maxHealth; } },
            { id:'aph_charm',    god:'Aphrodite', name:'Heartbreak',      desc:'Attacks slow enemies 20%', color:'#ff69b4', emoji:'💖',  apply: () => {} },
            { id:'aph_allure',   god:'Aphrodite', name:'Passion Flare',   desc:'+1 to all base damage',    color:'#ff69b4', emoji:'💖',  apply: p => { p.damage += 6; } },

            // ── Hermes ────────────────────────────────────────────────────
            { id:'her_swift',    god:'Hermes',    name:'Swift Strike',    desc:'-40% Attack cooldown',     color:'#00cc88', emoji:'⚡',  apply: p => { p.attackCooldown = Math.floor(p.attackCooldown * 0.6); } },
            { id:'her_dash',     god:'Hermes',    name:'Greater Recall',  desc:'+1 Dash Charge',           color:'#00cc88', emoji:'⚡',  apply: p => { p.maxDashCharges++; p.dashCharges = p.maxDashCharges; } },
            { id:'her_speed',    god:'Hermes',    name:'Hyper Sprint',    desc:'+30% Move Speed',          color:'#00cc88', emoji:'⚡',  apply: p => { p.runSpeed *= 1.3; p.speed *= 1.3; } },

            // ── Athena ────────────────────────────────────────────────────
            { id:'ath_divine',   god:'Athena',    name:'Divine Dash',     desc:'Dash deflects projectiles', color:'#aaddff', emoji:'🛡️', apply: () => {} },
            { id:'ath_aegis',    god:'Athena',    name:'Holy Shield',     desc:'-15% incoming damage',     color:'#aaddff', emoji:'🛡️', apply: p => { p._damageReduction = (p._damageReduction || 0) + 0.15; } },
            { id:'ath_wisdom',   god:'Athena',    name:'Brilliant Riposte',desc:'After dash, +50% dmg 2s', color:'#aaddff', emoji:'🛡️', apply: () => {} },
        ];

        engine.registerSystem('boon', this);
        console.log('[BoonSystem] Initialized');
    }

    /** Return 3 random boon options the player hasn't taken yet */
    getOptions(count = 3) {
        const taken = new Set(this.activeBoons.map(b => b.id));
        const pool  = this.catalog.filter(b => !taken.has(b.id));
        const out   = [];
        while (out.length < count && pool.length > 0) {
            const i = Math.floor(Math.random() * pool.length);
            out.push(pool.splice(i, 1)[0]);
        }
        return out;
    }

    /** Apply a chosen boon to the player */
    apply(boonId, player) {
        const boon = this.catalog.find(b => b.id === boonId);
        if (!boon) return false;
        boon.apply(player);
        this.activeBoons.push(boon);
        this.engine.emit('boon:applied', { boon, player });

        // Particle fanfare
        const parts = this.engine.getSystem('particle');
        if (parts) parts.createDivineAura(player.position.clone());

        return true;
    }

    getActive() { return [...this.activeBoons]; }
    clear()     { this.activeBoons = []; }
}
