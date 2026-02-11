/**
 * AnimationSystem.js - Character animation state machine
 * Handles walk, run, attack, idle animations
 */

class AnimationSystem {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        
        // Animation registry
        this.animations = new Map();
        this.characterAnimators = new Map();
        
        // Animation states
        this.states = {
            IDLE: 'idle',
            WALK: 'walk',
            RUN: 'run',
            ATTACK: 'attack',
            DASH: 'dash',
            HIT: 'hit',
            DEATH: 'death'
        };
        
        engine.registerSystem('animation', this);
        console.log('[AnimationSystem] Initialized');
    }
    
    /**
     * Create animator for a character
     */
    createAnimator(character, skeleton) {
        const animator = {
            character: character,
            skeleton: skeleton,
            currentState: this.states.IDLE,
            previousState: null,
            stateTime: 0,
            animations: {},
            blendTime: 0.2,
            locked: false, // For attack animations
            lockTime: 0
        };
        
        // Create all animations for this character
        this.createAllAnimations(animator);
        
        this.characterAnimators.set(character.id || character, animator);
        
        return animator;
    }
    
    /**
     * Create all animation cycles
     */
    createAllAnimations(animator) {
        // Idle animation
        animator.animations.idle = this.createIdleAnimation(animator);
        
        // Walk animation
        animator.animations.walk = this.createWalkAnimation(animator);
        
        // Run animation
        animator.animations.run = this.createRunAnimation(animator);
        
        // Attack animation
        animator.animations.attack = this.createAttackAnimation(animator);
        
        // Dash animation
        animator.animations.dash = this.createDashAnimation(animator);
        
        // Hit reaction
        animator.animations.hit = this.createHitAnimation(animator);
        
        // Death animation
        animator.animations.death = this.createDeathAnimation(animator);
    }
    
    /**
     * Create idle animation (subtle breathing)
     */
    createIdleAnimation(animator) {
        const anim = {
            name: 'idle',
            duration: 120, // 2 seconds at 60fps
            loop: true,
            keyframes: []
        };
        
        // Subtle bob up and down
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            const bobAmount = Math.sin(t * Math.PI * 2) * 0.05;
            
            anim.keyframes.push({
                frame: frame,
                bodyY: bobAmount,
                headRotX: Math.sin(t * Math.PI * 2) * 0.05
            });
        }
        
        return anim;
    }
    
    /**
     * Create walk animation
     */
    createWalkAnimation(animator) {
        const anim = {
            name: 'walk',
            duration: 40, // Slower than run
            loop: true,
            keyframes: []
        };
        
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            
            // Legs alternate
            const legCycle = Math.sin(t * Math.PI * 2);
            const legSwing = legCycle * 0.4;
            
            // Arms swing opposite to legs
            const armSwing = -legCycle * 0.3;
            
            // Body bob
            const bodyBob = Math.abs(Math.sin(t * Math.PI * 4)) * 0.1;
            
            anim.keyframes.push({
                frame: frame,
                leftLegRotX: legSwing,
                rightLegRotX: -legSwing,
                leftArmRotX: armSwing,
                rightArmRotX: -armSwing,
                bodyY: bodyBob,
                bodyRotZ: legCycle * 0.05 // Slight sway
            });
        }
        
        return anim;
    }
    
    /**
     * Create run animation
     */
    createRunAnimation(animator) {
        const anim = {
            name: 'run',
            duration: 24, // Faster than walk
            loop: true,
            keyframes: []
        };
        
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            
            // More exaggerated movements
            const legCycle = Math.sin(t * Math.PI * 2);
            const legSwing = legCycle * 0.7;
            
            const armSwing = -legCycle * 0.5;
            
            // More pronounced bob
            const bodyBob = Math.abs(Math.sin(t * Math.PI * 4)) * 0.15;
            
            // Forward lean when running
            const bodyLean = -0.2;
            
            anim.keyframes.push({
                frame: frame,
                leftLegRotX: legSwing,
                rightLegRotX: -legSwing,
                leftArmRotX: armSwing,
                rightArmRotX: -armSwing,
                bodyY: bodyBob,
                bodyRotX: bodyLean,
                bodyRotZ: legCycle * 0.08
            });
        }
        
        return anim;
    }
    
    /**
     * Create attack animation (weapon swing)
     */
    createAttackAnimation(animator) {
        const anim = {
            name: 'attack',
            duration: 20, // Fast attack
            loop: false,
            keyframes: [],
            lockDuration: 20 // Lock character during attack
        };
        
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            
            // Wind up (0-30%)
            if (t < 0.3) {
                const windUp = t / 0.3;
                anim.keyframes.push({
                    frame: frame,
                    rightArmRotX: -1.0 * windUp, // Pull back
                    rightArmRotY: 0.5 * windUp,
                    bodyRotY: -0.3 * windUp,
                    weaponRotZ: -0.5 * windUp
                });
            }
            // Swing (30-70%)
            else if (t < 0.7) {
                const swing = (t - 0.3) / 0.4;
                const swingCurve = this.easeOutCubic(swing);
                anim.keyframes.push({
                    frame: frame,
                    rightArmRotX: -1.0 + (2.5 * swingCurve), // Swing through
                    rightArmRotY: 0.5 - (1.0 * swingCurve),
                    bodyRotY: -0.3 + (0.8 * swingCurve),
                    weaponRotZ: -0.5 + (2.0 * swingCurve)
                });
            }
            // Follow through (70-100%)
            else {
                const followThrough = (t - 0.7) / 0.3;
                const ftCurve = this.easeOutQuad(followThrough);
                anim.keyframes.push({
                    frame: frame,
                    rightArmRotX: 1.5 - (0.5 * ftCurve),
                    rightArmRotY: -0.5 + (0.5 * ftCurve),
                    bodyRotY: 0.5 - (0.5 * ftCurve),
                    weaponRotZ: 1.5 - (1.5 * ftCurve)
                });
            }
        }
        
        return anim;
    }
    
    /**
     * Create dash animation
     */
    createDashAnimation(animator) {
        const anim = {
            name: 'dash',
            duration: 15,
            loop: false,
            keyframes: [],
            lockDuration: 15
        };
        
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            const curve = this.easeOutCubic(t);
            
            anim.keyframes.push({
                frame: frame,
                bodyRotX: -0.5 + (0.5 * curve), // Lean forward then recover
                leftArmRotX: -0.8,
                rightArmRotX: -0.8,
                leftLegRotX: 0.5,
                rightLegRotX: 0.5,
                bodyY: 0.2 * (1 - curve) // Slight hop
            });
        }
        
        return anim;
    }
    
    /**
     * Create hit reaction animation
     */
    createHitAnimation(animator) {
        const anim = {
            name: 'hit',
            duration: 12,
            loop: false,
            keyframes: [],
            lockDuration: 12
        };
        
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            
            // Recoil back
            if (t < 0.5) {
                const recoil = t / 0.5;
                anim.keyframes.push({
                    frame: frame,
                    bodyRotX: 0.3 * recoil,
                    bodyY: -0.1 * recoil,
                    headRotX: 0.2 * recoil
                });
            }
            // Recover
            else {
                const recover = (t - 0.5) / 0.5;
                anim.keyframes.push({
                    frame: frame,
                    bodyRotX: 0.3 * (1 - recover),
                    bodyY: -0.1 * (1 - recover),
                    headRotX: 0.2 * (1 - recover)
                });
            }
        }
        
        return anim;
    }
    
    /**
     * Create death animation
     */
    createDeathAnimation(animator) {
        const anim = {
            name: 'death',
            duration: 40,
            loop: false,
            keyframes: []
        };
        
        for (let frame = 0; frame <= anim.duration; frame++) {
            const t = frame / anim.duration;
            const curve = this.easeInQuad(t);
            
            anim.keyframes.push({
                frame: frame,
                bodyRotX: 1.5 * curve, // Fall forward
                bodyY: -1.5 * curve, // Collapse down
                leftArmRotX: 0.5 * curve,
                rightArmRotX: 0.5 * curve,
                leftLegRotX: -0.3 * curve,
                rightLegRotX: -0.3 * curve,
                headRotX: 0.5 * curve
            });
        }
        
        return anim;
    }
    
    /**
     * Update animations for all characters
     */
    update(deltaTime) {
        this.characterAnimators.forEach((animator, character) => {
            this.updateAnimator(animator, deltaTime);
        });
    }
    
    /**
     * Update single animator
     */
    updateAnimator(animator, deltaTime) {
        animator.stateTime += deltaTime;
        
        // Handle locked animations (attack, dash, hit)
        if (animator.locked) {
            animator.lockTime--;
            if (animator.lockTime <= 0) {
                animator.locked = false;
                this.transitionToState(animator, this.states.IDLE);
            }
        }
        
        // Apply current animation
        const currentAnim = animator.animations[animator.currentState];
        if (currentAnim) {
            this.applyAnimation(animator, currentAnim);
        }
    }
    
    /**
     * Apply animation keyframes to skeleton
     */
    applyAnimation(animator, animation) {
        if (!animator.skeleton) return;
        
        const frame = Math.floor(animator.stateTime) % animation.duration;
        const nextFrame = (frame + 1) % animation.duration;
        const t = (animator.stateTime % 1);
        
        const current = animation.keyframes[frame];
        const next = animation.keyframes[nextFrame];
        
        if (!current || !next) return;
        
        // Interpolate between frames
        const bones = animator.skeleton.bones;
        
        Object.keys(current).forEach(key => {
            if (key === 'frame') return;
            
            const currentVal = current[key] || 0;
            const nextVal = next[key] || 0;
            const value = this.lerp(currentVal, nextVal, t);
            
            // Apply to bones
            this.applyBoneTransform(bones, key, value);
        });
    }
    
    /**
     * Apply transform to bone
     */
    applyBoneTransform(bones, transform, value) {
        // This is a simplified version
        // In a real implementation, you'd have proper bone hierarchy
        
        const boneMap = {
            'bodyY': 'root',
            'bodyRotX': 'root',
            'bodyRotY': 'root',
            'bodyRotZ': 'root',
            'leftLegRotX': 'leftLeg',
            'rightLegRotX': 'rightLeg',
            'leftArmRotX': 'leftArm',
            'rightArmRotX': 'rightArm',
            'headRotX': 'head',
            'weaponRotZ': 'weapon'
        };
        
        const boneName = boneMap[transform];
        const bone = bones[boneName];
        
        if (bone) {
            if (transform.includes('RotX')) {
                bone.rotation.x = value;
            } else if (transform.includes('RotY')) {
                bone.rotation.y = value;
            } else if (transform.includes('RotZ')) {
                bone.rotation.z = value;
            } else if (transform.endsWith('Y')) {
                bone.position.y = value;
            }
        }
    }
    
    /**
     * Transition to new state
     */
    transitionToState(animator, newState) {
        if (animator.locked && newState !== animator.currentState) {
            return; // Can't transition while locked
        }
        
        animator.previousState = animator.currentState;
        animator.currentState = newState;
        animator.stateTime = 0;
        
        // Lock if needed
        const anim = animator.animations[newState];
        if (anim && anim.lockDuration) {
            animator.locked = true;
            animator.lockTime = anim.lockDuration;
        }
    }
    
    /**
     * Play attack animation
     */
    playAttack(character) {
        const animator = this.characterAnimators.get(character);
        if (animator && !animator.locked) {
            this.transitionToState(animator, this.states.ATTACK);
        }
    }
    
    /**
     * Play dash animation
     */
    playDash(character) {
        const animator = this.characterAnimators.get(character);
        if (animator && !animator.locked) {
            this.transitionToState(animator, this.states.DASH);
        }
    }
    
    /**
     * Play hit animation
     */
    playHit(character) {
        const animator = this.characterAnimators.get(character);
        if (animator && !animator.locked) {
            this.transitionToState(animator, this.states.HIT);
        }
    }
    
    /**
     * Set movement state based on velocity
     */
    setMovementState(character, velocity) {
        const animator = this.characterAnimators.get(character);
        if (!animator || animator.locked) return;
        
        const speed = velocity.length();
        
        if (speed < 0.01) {
            this.transitionToState(animator, this.states.IDLE);
        } else if (speed < 0.15) {
            this.transitionToState(animator, this.states.WALK);
        } else {
            this.transitionToState(animator, this.states.RUN);
        }
    }
    
    /**
     * Easing functions
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeInQuad(t) {
        return t * t;
    }
    
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    /**
     * Remove animator
     */
    removeAnimator(character) {
        this.characterAnimators.delete(character);
    }
}
