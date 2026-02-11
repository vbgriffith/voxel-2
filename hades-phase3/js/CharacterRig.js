/**
 * CharacterRig.js - Creates rigged character models with skeleton
 * Proper arms, legs, torso, head structure
 */

class CharacterRig {
    constructor(engine, type = 'player') {
        this.engine = engine;
        this.scene = engine.scene;
        this.type = type;
        
        // Skeleton structure
        this.skeleton = {
            root: null,
            torso: null,
            head: null,
            leftArm: null,
            rightArm: null,
            leftLeg: null,
            rightLeg: null,
            leftFoot: null,
            rightFoot: null,
            weapon: null,
            bones: {}
        };
        
        // Model parts
        this.meshes = [];
        this.rootNode = null;
        
        this.createRig();
    }
    
    /**
     * Create complete character rig
     */
    createRig() {
        // Root node (position/rotation reference)
        this.rootNode = new BABYLON.TransformNode(`${this.type}Root`, this.scene);
        this.skeleton.root = this.rootNode;
        this.skeleton.bones.root = this.rootNode;
        
        // Create body parts
        this.createTorso();
        this.createHead();
        this.createArms();
        this.createLegs();
        
        if (this.type === 'player') {
            this.createWeapon();
        }
        
        // Store all meshes for easy manipulation
        this.meshes = this.rootNode.getChildMeshes();
    }
    
    /**
     * Create torso
     */
    createTorso() {
        const torso = BABYLON.MeshBuilder.CreateCapsule(`${this.type}Torso`, {
            height: 1.2,
            radius: 0.3,
            subdivisions: 8
        }, this.scene);
        
        torso.position.y = 1.5;
        torso.parent = this.rootNode;
        
        // Material
        const mat = this.createMaterial('torso');
        torso.material = mat;
        
        this.skeleton.torso = torso;
        this.skeleton.bones.torso = torso;
    }
    
    /**
     * Create head
     */
    createHead() {
        const head = BABYLON.MeshBuilder.CreateSphere(`${this.type}Head`, {
            diameter: 0.5,
            segments: 12
        }, this.scene);
        
        head.position.y = 2.4;
        head.parent = this.rootNode;
        
        const mat = this.createMaterial('head');
        head.material = mat;
        
        this.skeleton.head = head;
        this.skeleton.bones.head = head;
    }
    
    /**
     * Create arms
     */
    createArms() {
        // Left arm
        const leftShoulder = new BABYLON.TransformNode(`${this.type}LeftShoulder`, this.scene);
        leftShoulder.position = new BABYLON.Vector3(-0.4, 2, 0);
        leftShoulder.parent = this.rootNode;
        
        const leftArm = BABYLON.MeshBuilder.CreateCapsule(`${this.type}LeftArm`, {
            height: 0.7,
            radius: 0.12,
            subdivisions: 6
        }, this.scene);
        leftArm.position.y = -0.35;
        leftArm.parent = leftShoulder;
        
        const leftForearm = BABYLON.MeshBuilder.CreateCapsule(`${this.type}LeftForearm`, {
            height: 0.6,
            radius: 0.1,
            subdivisions: 6
        }, this.scene);
        leftForearm.position.y = -0.65;
        leftForearm.parent = leftShoulder;
        
        const leftHand = BABYLON.MeshBuilder.CreateSphere(`${this.type}LeftHand`, {
            diameter: 0.2,
            segments: 8
        }, this.scene);
        leftHand.position.y = -0.95;
        leftHand.parent = leftShoulder;
        
        const mat = this.createMaterial('arm');
        leftArm.material = mat;
        leftForearm.material = mat;
        leftHand.material = mat;
        
        this.skeleton.leftArm = leftShoulder;
        this.skeleton.bones.leftArm = leftShoulder;
        
        // Right arm
        const rightShoulder = new BABYLON.TransformNode(`${this.type}RightShoulder`, this.scene);
        rightShoulder.position = new BABYLON.Vector3(0.4, 2, 0);
        rightShoulder.parent = this.rootNode;
        
        const rightArm = BABYLON.MeshBuilder.CreateCapsule(`${this.type}RightArm`, {
            height: 0.7,
            radius: 0.12,
            subdivisions: 6
        }, this.scene);
        rightArm.position.y = -0.35;
        rightArm.parent = rightShoulder;
        
        const rightForearm = BABYLON.MeshBuilder.CreateCapsule(`${this.type}RightForearm`, {
            height: 0.6,
            radius: 0.1,
            subdivisions: 6
        }, this.scene);
        rightForearm.position.y = -0.65;
        rightForearm.parent = rightShoulder;
        
        const rightHand = BABYLON.MeshBuilder.CreateSphere(`${this.type}RightHand`, {
            diameter: 0.2,
            segments: 8
        }, this.scene);
        rightHand.position.y = -0.95;
        rightHand.parent = rightShoulder;
        
        rightArm.material = mat;
        rightForearm.material = mat;
        rightHand.material = mat;
        
        this.skeleton.rightArm = rightShoulder;
        this.skeleton.bones.rightArm = rightShoulder;
    }
    
    /**
     * Create legs
     */
    createLegs() {
        // Left leg
        const leftHip = new BABYLON.TransformNode(`${this.type}LeftHip`, this.scene);
        leftHip.position = new BABYLON.Vector3(-0.15, 0.9, 0);
        leftHip.parent = this.rootNode;
        
        const leftThigh = BABYLON.MeshBuilder.CreateCapsule(`${this.type}LeftThigh`, {
            height: 0.8,
            radius: 0.15,
            subdivisions: 6
        }, this.scene);
        leftThigh.position.y = -0.4;
        leftThigh.parent = leftHip;
        
        const leftShin = BABYLON.MeshBuilder.CreateCapsule(`${this.type}LeftShin`, {
            height: 0.7,
            radius: 0.12,
            subdivisions: 6
        }, this.scene);
        leftShin.position.y = -0.75;
        leftShin.parent = leftHip;
        
        const leftFoot = BABYLON.MeshBuilder.CreateBox(`${this.type}LeftFoot`, {
            width: 0.2,
            height: 0.15,
            depth: 0.35
        }, this.scene);
        leftFoot.position = new BABYLON.Vector3(0, -1.15, 0.08);
        leftFoot.parent = leftHip;
        
        const mat = this.createMaterial('leg');
        leftThigh.material = mat;
        leftShin.material = mat;
        leftFoot.material = mat;
        
        this.skeleton.leftLeg = leftHip;
        this.skeleton.leftFoot = leftFoot;
        this.skeleton.bones.leftLeg = leftHip;
        
        // Right leg
        const rightHip = new BABYLON.TransformNode(`${this.type}RightHip`, this.scene);
        rightHip.position = new BABYLON.Vector3(0.15, 0.9, 0);
        rightHip.parent = this.rootNode;
        
        const rightThigh = BABYLON.MeshBuilder.CreateCapsule(`${this.type}RightThigh`, {
            height: 0.8,
            radius: 0.15,
            subdivisions: 6
        }, this.scene);
        rightThigh.position.y = -0.4;
        rightThigh.parent = rightHip;
        
        const rightShin = BABYLON.MeshBuilder.CreateCapsule(`${this.type}RightShin`, {
            height: 0.7,
            radius: 0.12,
            subdivisions: 6
        }, this.scene);
        rightShin.position.y = -0.75;
        rightShin.parent = rightHip;
        
        const rightFoot = BABYLON.MeshBuilder.CreateBox(`${this.type}RightFoot`, {
            width: 0.2,
            height: 0.15,
            depth: 0.35
        }, this.scene);
        rightFoot.position = new BABYLON.Vector3(0, -1.15, 0.08);
        rightFoot.parent = rightHip;
        
        rightThigh.material = mat;
        rightShin.material = mat;
        rightFoot.material = mat;
        
        this.skeleton.rightLeg = rightHip;
        this.skeleton.rightFoot = rightFoot;
        this.skeleton.bones.rightLeg = rightHip;
    }
    
    /**
     * Create weapon
     */
    createWeapon() {
        const weapon = BABYLON.MeshBuilder.CreateBox(`${this.type}Weapon`, {
            width: 0.15,
            height: 0.15,
            depth: 1.5
        }, this.scene);
        
        weapon.position = new BABYLON.Vector3(0, -0.6, 0.6);
        weapon.parent = this.skeleton.rightArm;
        
        const mat = new BABYLON.StandardMaterial(`${this.type}WeaponMat`, this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.3);
        mat.emissiveColor = new BABYLON.Color3(0.6, 0.5, 0.1);
        mat.specularColor = new BABYLON.Color3(1, 1, 0.5);
        mat.specularPower = 128;
        weapon.material = mat;
        
        this.skeleton.weapon = weapon;
        this.skeleton.bones.weapon = weapon;
    }
    
    /**
     * Create material for body part
     */
    createMaterial(part) {
        const mat = new BABYLON.StandardMaterial(`${this.type}${part}Mat`, this.scene);
        
        // Color based on type
        if (this.type === 'player') {
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.9);
            mat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
            mat.specularColor = new BABYLON.Color3(0.4, 0.5, 0.8);
        } else {
            // Enemy colors
            mat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
            mat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
            mat.specularColor = new BABYLON.Color3(0.5, 0.2, 0.2);
        }
        
        mat.specularPower = 64;
        return mat;
    }
    
    /**
     * Get skeleton for animation
     */
    getSkeleton() {
        return this.skeleton;
    }
    
    /**
     * Get root node
     */
    getRootNode() {
        return this.rootNode;
    }
    
    /**
     * Set position
     */
    setPosition(x, y, z) {
        this.rootNode.position = new BABYLON.Vector3(x, y, z);
    }
    
    /**
     * Set rotation
     */
    setRotation(x, y, z) {
        this.rootNode.rotation = new BABYLON.Vector3(x, y, z);
    }
    
    /**
     * Dispose rig
     */
    dispose() {
        this.meshes.forEach(mesh => mesh.dispose());
        this.rootNode.dispose();
    }
}
