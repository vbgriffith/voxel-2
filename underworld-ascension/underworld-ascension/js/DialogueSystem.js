/**
 * DialogueSystem.js - Phase 4
 * Branching dialogue trees, NPC conversations, lore delivery.
 */
class DialogueSystem {
    constructor(engine) {
        this.engine = engine;
        this.active = false;
        this.current = null;
        this.nodeId = null;

        // All dialogue trees keyed by NPC id
        this.trees = this.buildTrees();

        engine.registerSystem('dialogue', this);
        console.log('[DialogueSystem] Initialized');
    }

    buildTrees() {
        return {
            hades: {
                name: 'Hades',
                portrait: '👑',
                color: '#8B0000',
                nodes: {
                    start: {
                        text: "So. You dare attempt to leave the Underworld again. How refreshing that you still have the energy for futility.",
                        choices: [
                            { label: "I will escape.", next: 'defiant' },
                            { label: "Tell me about the way out.", next: 'lore_exit' },
                            { label: "...", next: 'silent' }
                        ]
                    },
                    defiant: {
                        text: "Yes, yes. That tireless spirit is why I almost admire you. Almost. Carry on — it makes the work more interesting.",
                        choices: [{ label: "Goodbye.", next: null }]
                    },
                    lore_exit: {
                        text: "The surface lies beyond the Greece of the living. To reach it you must best my finest guardians. None has ever succeeded.",
                        choices: [
                            { label: "I'll be the first.", next: 'defiant' },
                            { label: "What waits at the top?", next: 'lore_olympus' }
                        ]
                    },
                    lore_olympus: {
                        text: "Your father, Zeus, and the rest of those insufferable Olympians. They'll be delighted to see you, no doubt. I am less certain of my own feelings.",
                        choices: [{ label: "I understand.", next: null }]
                    },
                    silent: {
                        text: "Hmph. Dignity in silence. Very well. We shall speak another time.",
                        choices: [{ label: "Leave.", next: null }]
                    }
                }
            },
            nyx: {
                name: 'Nyx',
                portrait: '🌙',
                color: '#3A1F5A',
                nodes: {
                    start: {
                        text: "Dear child. The darkness welcomes you, as always. What wisdom do you seek tonight?",
                        choices: [
                            { label: "Who am I, really?", next: 'identity' },
                            { label: "What is beyond the surface?", next: 'surface' },
                            { label: "Just passing through.", next: 'farewell' }
                        ]
                    },
                    identity: {
                        text: "You are the son of Hades and Persephone — more than mortal, more than god. Your nature is something in between, a bridge between life and death.",
                        choices: [
                            { label: "Persephone is my mother?", next: 'mother' },
                            { label: "That explains much.", next: 'farewell' }
                        ]
                    },
                    mother: {
                        text: "She departed long ago. The reasons are... complicated. Perhaps if you reach the surface, you might find her. But speak nothing of this to Hades.",
                        choices: [{ label: "I won't. Thank you.", next: null }]
                    },
                    surface: {
                        text: "Light, warmth, the sky — things we of the Underworld can only imagine. I have watched it through the threads of fate. It is beautiful, and dangerous.",
                        choices: [{ label: "I will see it myself.", next: 'farewell' }]
                    },
                    farewell: {
                        text: "Go well, dear child. The darkness will guide your path, even where light cannot reach.",
                        choices: [{ label: "Farewell.", next: null }]
                    }
                }
            },
            merchant: {
                name: 'Charon',
                portrait: '💀',
                color: '#4A3F00',
                nodes: {
                    start: {
                        text: "OBOL. OBOL. OBOL.",
                        choices: [
                            { label: "I wish to purchase an upgrade.", next: 'shop' },
                            { label: "I need a new weapon.", next: 'weapons' },
                            { label: "Never mind.", next: null }
                        ]
                    },
                    shop: {
                        text: "OBOL. OBOL. (He gestures toward the wares with a skeletal hand.)",
                        choices: [
                            { label: "Open the Mirror of Night.", next: null, action: 'openMirror' },
                            { label: "Back.", next: 'start' }
                        ]
                    },
                    weapons: {
                        text: "OBOL. OBOL. OBOL. (He displays an array of gleaming weapons.)",
                        choices: [
                            { label: "Open weapon shop.", next: null, action: 'openWeaponShop' },
                            { label: "Back.", next: 'start' }
                        ]
                    }
                }
            },
            achilles: {
                name: 'Achilles',
                portrait: '⚔️',
                color: '#8B6914',
                nodes: {
                    start: {
                        text: "Prince Zagreus. Training hard today? Good. Strength of body means nothing without strength of will.",
                        choices: [
                            { label: "Teach me to fight better.", next: 'training' },
                            { label: "Tell me about your life.", next: 'story' },
                            { label: "I must go.", next: null }
                        ]
                    },
                    training: {
                        text: "Your dash is your greatest tool. Use it not merely to escape, but to position. Get behind your enemy before striking. They cannot hit what they cannot see.",
                        choices: [
                            { label: "What about groups?", next: 'groups' },
                            { label: "Understood. Thank you.", next: null }
                        ]
                    },
                    groups: {
                        text: "Against many enemies, never stop moving. Target the ranged ones first — they are the most dangerous at distance. Draw the melee enemies to you one at a time.",
                        choices: [{ label: "Good advice.", next: null }]
                    },
                    story: {
                        text: "I was the greatest warrior of my age — and still I fell. Pride, Zagreus. Pride was my undoing. Learn from my mistake. Fight smart, not just hard.",
                        choices: [
                            { label: "I will remember that.", next: null },
                            { label: "Who was Patroclus to you?", next: 'patroclus' }
                        ]
                    },
                    patroclus: {
                        text: "He was... everything. And I failed him. He should be here in Elysium, not the Asphodel Meadows. I hope someday to speak with him again.",
                        choices: [{ label: "Perhaps I can help.", next: null }]
                    }
                }
            }
        };
    }

    start(npcId, nodeId = 'start') {
        const tree = this.trees[npcId];
        if (!tree) return false;
        this.active  = true;
        this.current = tree;
        this.nodeId  = nodeId;
        const node   = tree.nodes[nodeId];
        this.engine.emit('dialogue:start', { npc: tree, node, choices: node.choices });
        return true;
    }

    choose(choiceIndex) {
        if (!this.active || !this.current) return;
        const node   = this.current.nodes[this.nodeId];
        const choice = node.choices[choiceIndex];
        if (!choice) return;

        // Fire optional action
        if (choice.action) this.engine.emit('dialogue:action', { action: choice.action });

        if (choice.next === null) {
            this.end();
        } else {
            this.nodeId    = choice.next;
            const nextNode = this.current.nodes[choice.next];
            this.engine.emit('dialogue:node', { npc: this.current, node: nextNode, choices: nextNode.choices });
        }
    }

    end() {
        this.active  = false;
        this.current = null;
        this.nodeId  = null;
        this.engine.emit('dialogue:end');
    }

    isActive() { return this.active; }
}
