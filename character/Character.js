import * as THREE from '../node_modules/three/build/three.module.js';
import { FBXLoader } from '../node_modules/three/examples/jsm/loaders/FBXLoader.js';
import { FPPControls } from '../controls/FPPControls.js';

let controls;
let controls2;
let mixers;
let animationLoaded = false;
const clock = new THREE.Clock();
const clock1 = new THREE.Clock();
const clock2 = new THREE.Clock();
var Character = function (scene, render, camera, objects, physicsWorld) {
    this._previousRAF = null;
    this.scene = scene;
    this.camera = camera;
    this.renderT = render;
    this.objects = objects;
    this.physicsWorld = physicsWorld;
    this.fbx = null;
    this.loadCharacter = function (path) {
        const loader = new FBXLoader();
        loader.load(path, (fbx) => {
            fbx.scale.setScalar(0.1);
            fbx.traverse(c => {
                c.castShadow = true;
            });

            const params = {
                target: fbx,
            }
            controls = new FPPControls(fbx, this.renderT.domElement, true);
            controls.movementSpeed = 100;
            controls.lookSpeed = 0.1;
            controls.lookVertical = false;
            controls2 = new FPPControls(this.camera, this.renderT.domElement, false);
            controls2.movementSpeed = 100;
            controls2.lookSpeed = 0.1;
            controls2.lookVertical = false;

            fbx.position.y=1;

            var shape = new Ammo.btConeShape(1, 1);//radius, height
            const localInertia = new Ammo.btVector3(0, 0, 0);
            shape.calculateLocalInertia(10, localInertia);
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            const pos = fbx.position;
            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
            const motionState = new Ammo.btDefaultMotionState(transform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(2, motionState, shape, localInertia);
            const body = new Ammo.btRigidBody(rbInfo);

            fbx.userData.physicsBody = body;

            fbx.receiveShadow = true;
            fbx.castShadow = true;

            this.scene.add(fbx);
            // this.objects.push(fbx);

            this.physicsWorld.addRigidBody(body);

            this.fbx = fbx;
        });
        console.log(this.fbx);
    }
    this.loadAnimation = function (path) {
        if (this.fbx != null) {
            const anim = new FBXLoader();
            anim.load(path, (anim) => {
                mixers = new THREE.AnimationMixer(this.fbx);
                const idle = mixers.clipAction(anim.animations[0]);
                idle.play();
            });
            console.log("defined:");
            console.log(this.fbx);
        } else {
            console.log("undefined character");
        }

    }
    this._RAF = function (path) {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            this._RAF(path);

            const delta = clock.getDelta();

            if (mixers) mixers.update(delta);

            // this.renderT.render(this.scene, this.camera);
            if (animationLoaded) {
                // console.log(this.fbx.rotation.y);
                // console.log(this.camera.rotation.y);
                controls.update(clock1.getDelta());
                controls2.update(clock2.getDelta());
                // this.camera.rotation.y = this.fbx.rotation.y;

            }
            if (!animationLoaded && this.fbx != null) {
                this.loadAnimation(path);
                animationLoaded = true;
            }

        });
    }
    this.TPPCamera = function (camera) {
        controls2 = new FPPControls(camera, this.renderT.domElement, false);
        controls2.movementSpeed = 100;
        controls2.lookSpeed = 0.1;
        controls2.lookVertical = false;
    }
    this.animate = function (path) {
        window.requestIdleCallback(this._RAF(path));
    }
    this.handleResizeControls = function () {
        controls.handleResize();
        controls2.handleResize();
    }

}
export { Character };
