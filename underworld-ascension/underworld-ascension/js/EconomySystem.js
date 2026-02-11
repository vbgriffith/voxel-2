/**
 * EconomySystem.js - Phase 4
 * Manages Darkness, Gems, weapon upgrades, and the Mirror of Night.
 */
class EconomySystem {
    constructor(engine) {
        this.engine = engine;

        this.currencies = { darkness: 0, gems: 0 };

        // Permanent upgrades (Mirror of Night)
        this.upgrades = {
            healthUp:    { name: 'Death Defiance',   desc: '+25 Max HP',          cost: [50,100,200], level: 0, max: 3 },
            damageUp:    { name: 'Ruthless Reflex',  desc: '+10 Attack Damage',   cost: [60,120,240], level: 0, max: 3 },
            dashUp:      { name: 'Greater Recall',   desc: '+1 Dash Charge',      cost: [80,160],     level: 0, max: 2 },
            speedUp:     { name: 'Swift Strike',     desc: '+15% Move Speed',     cost: [40,80,160],  level: 0, max: 3 },
            gemFind:     { name: 'Chthonic Vitality', desc: '+1 Gem per room',    cost: [70,140],     level: 0, max: 2 },
        };

        // Weapons available in shop
        this.weapons = [
            { id:'stygius',  name:'Stygius',     desc:'Fast sword — balanced attacks',   baseDmg:20, cost:0,   unlocked:true  },
            { id:'varatha',  name:'Varatha',      desc:'Spear — longer reach',            baseDmg:16, cost:120, unlocked:false },
            { id:'aegis',    name:'Aegis',        desc:'Shield — powerful AoE',           baseDmg:22, cost:200, unlocked:false },
            { id:'exagryph', name:'Exagryph',     desc:'Rail gun — long range',           baseDmg:18, cost:180, unlocked:false },
        ];
        this.equippedWeapon = 'stygius';

        engine.on('currency:drop', d => this.collect(d.type, d.amount));
        engine.registerSystem('economy', this);
        console.log('[EconomySystem] Initialized');
    }

    collect(type, amount) {
        if (this.currencies[type] !== undefined) {
            this.currencies[type] += amount;
            this.engine.emit('economy:updated', { ...this.currencies });
        }
    }

    canAfford(type, amount) {
        return this.currencies[type] >= amount;
    }

    spend(type, amount) {
        if (!this.canAfford(type, amount)) return false;
        this.currencies[type] -= amount;
        this.engine.emit('economy:updated', { ...this.currencies });
        return true;
    }

    buyUpgrade(id) {
        const up = this.upgrades[id];
        if (!up || up.level >= up.max) return { ok: false, reason: 'Max level reached' };
        const cost = up.cost[up.level];
        if (!this.spend('darkness', cost)) return { ok: false, reason: 'Not enough Darkness' };
        up.level++;
        this.applyUpgrade(id, up.level);
        this.engine.emit('upgrade:purchased', { id, level: up.level, upgrade: up });
        return { ok: true };
    }

    applyUpgrade(id, level) {
        this.engine.emit('upgrade:apply', { id, level });
    }

    buyWeapon(id) {
        const w = this.weapons.find(x => x.id === id);
        if (!w || w.unlocked) return { ok: false, reason: w ? 'Already owned' : 'Not found' };
        if (!this.spend('gems', w.cost)) return { ok: false, reason: 'Not enough Gems' };
        w.unlocked = true;
        this.engine.emit('weapon:unlocked', { weapon: w });
        return { ok: true };
    }

    equipWeapon(id) {
        const w = this.weapons.find(x => x.id === id);
        if (!w || !w.unlocked) return false;
        this.equippedWeapon = id;
        this.engine.emit('weapon:equipped', { weapon: w });
        return true;
    }

    getEquippedWeapon() {
        return this.weapons.find(w => w.id === this.equippedWeapon);
    }

    getUpgradeSummary() { return this.upgrades; }
    getCurrencies()      { return { ...this.currencies }; }
    getWeapons()         { return this.weapons; }
}
