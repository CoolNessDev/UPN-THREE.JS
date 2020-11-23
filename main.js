import * as THREE from './node_modules/three/build/three.module.js';
import LoadScene from "./scene/evironment.js";
import FPPCamera from "./camera/FPPCamera.js";
import TPPCamera from "./camera/TPPCamera.js";
import { GUI } from './node_modules/three/examples/jsm/libs/dat.gui.module.js';
import { Character } from "./character/Character.js";
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import CargarModelos from './models/loaders.js';


const mouse = new THREE.Vector2();
//instances
let SCENE = null;
let CHARACTER = null;
let UPN = null;
let INTERSECTED;

// lights
let spotLight;
let ambientLight;

// Graphics variables
let container, stats;
let camera, scene, raycaster, renderer, gui;
let orbitControls
var posCameraX;
var posCameraY;
var posCameraZ;
var rotCameraX;
var rotCameraY;
var rotCameraZ;

const clock = new THREE.Clock();

// Physics variables
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let physicsWorld;
const dynamicObjects = [];
let transformAux1;
var cube;


Ammo().then(function (AmmoLib) {
    Ammo = AmmoLib;
    init();
    window.requestIdleCallback(animate);

});
// init();
// window.requestIdleCallback(animate);
// window.requestIdleCallback(animate2);
function init() {
    container = document.getElementById("canvas");
    document.body.appendChild(container);

    raycaster = new THREE.Raycaster();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);


    window.addEventListener('resize', _OnWindowResize, false);


    camera = new FPPCamera(renderer);

    saveCamera();
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enabled = false;
    loadCamera();




    scene = new THREE.Scene();
    //Luces
    spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(205, 168, 347);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.1;
    spotLight.decay = 3;
    spotLight.distance = 600;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 512;
    spotLight.shadow.mapSize.height = 512;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.focus = 1;
    scene.add(spotLight);

    ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    //gui
    scene.userData.fppCamera = true;
    scene.userData.ambientLight = new THREE.Color(0x00FFFF);
    // console.log(scene.userData.ambientLight);
    createGUI();


    SCENE = new LoadScene(scene, scene.userData.ambientLight);
    UPN = new CargarModelos(scene);

    initPhysics();

    //temporal cube
    const sx = 6;
    const sy = 6;
    const sz = 6;
    const geometry = new THREE.BoxBufferGeometry(20, 20, 20);
    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // material.colorWrite=false;
    cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
    cube.position.y = 80;
    cube.position.z = 0;

    var shape = new Ammo.btConeShape(1, sy);//radius, height
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(10, localInertia);
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const pos = cube.position;
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(2, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    cube.userData.physicsBody = body;

    cube.receiveShadow = true;
    cube.castShadow = true;

    scene.add(cube);
    dynamicObjects.push(cube);

    physicsWorld.addRigidBody(body);



    document.addEventListener('mousemove', onDocumentMouseMove, false);

    //character
    CHARACTER = new Character(scene, renderer, camera, dynamicObjects, physicsWorld);
    CHARACTER.loadCharacter('./models/boy/character.fbx');
    CHARACTER._RAF('./models/boy/walk.fbx');





}
function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    // console.log(mouse);

}
function initPhysics() {

    // Physics configuration

    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, - 9.8, 0));

    // Create the terrain body

    const groundShape = SCENE.createTerrainShape();
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    // Shifts the terrain, since bullet re-centers it on its bounding box.
    groundTransform.setOrigin(new Ammo.btVector3(0, (SCENE.getTerrainMaxHeight() + SCENE.getTerrainMinHeight()) / 2, 0));
    const groundMass = 0;
    const groundLocalInertia = new Ammo.btVector3(0, 0, 0);
    const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
    const groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, groundShape, groundLocalInertia));
    physicsWorld.addRigidBody(groundBody);

    transformAux1 = new Ammo.btTransform();

}
function createGUI() {

    if (gui) {

        gui.destroy();

    }

    gui = new GUI({ width: 350 });


    const graphicsFolder = gui.addFolder("Graphics");

    graphicsFolder.add(scene.userData, "fppCamera").name("FPPCamera");


    const params = {
        'light color': spotLight.color.getHex(),
        Intensidad: spotLight.intensity,
        Distancia: spotLight.distance,
        Angulo: spotLight.angle,
        Penumbra: spotLight.penumbra,
        Decadencia: spotLight.decay,
        Foco: spotLight.shadow.focus,
        PosX: spotLight.position.x,
        PosY: spotLight.position.y,
        PosZ: spotLight.position.z
    };
    graphicsFolder.addColor(params, 'light color').name('Color de Iluminacion').onChange(function (val) {
        spotLight.color.setHex(val);
    });
    graphicsFolder.add(params, 'Intensidad', 0, 10).name(' Intensidad de Iluminación').onChange(function (val) {
        spotLight.intensity = val;
    });
    graphicsFolder.add(params, 'Distancia', 50, 1000).onChange(function (val) {
        spotLight.distance = val;
    });
    graphicsFolder.add(params, 'Angulo', 0, Math.PI / 2).onChange(function (val) {
        spotLight.angle = val;
    });
    graphicsFolder.add(params, 'Penumbra', 0, 1).onChange(function (val) {
        spotLight.penumbra = val;
    });
    graphicsFolder.add(params, 'Decadencia', 1, 2).onChange(function (val) {
        spotLight.decay = val;
    });
    graphicsFolder.add(params, 'Foco', 0, 1).onChange(function (val) {
        spotLight.shadow.focus = val;
    });
    graphicsFolder.add(params, 'PosX', 0, 300).onChange(function (val) {
        spotLight.position.x = val;
    });
    graphicsFolder.add(params, 'PosY', 0, 500).onChange(function (val) {
        spotLight.position.y = val;
    });
    graphicsFolder.add(params, 'PosZ', -200, 600).onChange(function (val) {
        spotLight.position.z = val;
    });


   /* const params2 = {
        'light color': ambientLight.color.getHex(),
    };
    graphicsFolder.addColor(params2, 'light color').name('Luz de Ambiente').onChange(function (val) {
        ambientLight.color.setHex(val);
    });*/
    const params2 = {
        'light color': ambientLight.color.getHex(),
        intensity: ambientLight.intensity
    };
    graphicsFolder.addColor(params2, 'light color').name('Luz Ambiental').onChange(function (val) {
        ambientLight.color.setHex(val);
    });
    graphicsFolder.add(params2, 'intensity', 0, 1.5).name(' Intensidad Luz Ambiental').onChange(function (val) {
        ambientLight.intensity = val;
        
    });

    graphicsFolder.open();

}

function _OnWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    CHARACTER.handleResizeControls();
}
function animate() {

    requestAnimationFrame(animate);

    // const delta = clock.getDelta();

    // if (mixers) mixers.update(delta);

    // renderer.render(scene, camera);
    // controls.update(clock1.getDelta());
    // controls2.update(clock2.getDelta());
    render();


}
function animate2() {
    requestAnimationFrame(animate2);
    //    console.log("gaaaaaa");


}
function render() {

    const deltaTime = clock.getDelta();
    CHARACTER.enableControls(scene.userData.fppCamera);
    if (scene.userData.fppCamera) {
        if (orbitControls.enabled) {
            CHARACTER.restoreCamera(camera);
        }
        orbitControls.enabled = false;
    } else {
        orbitControls.enabled = true;
        orbitControls.update();
    }
    // SCENE.updateLight();

    updatePhysics(deltaTime);
    //raycaster
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {

        const targetDistance = intersects[0].distance;

        // camera.focusAt(targetDistance); // using Cinematic camera focusAt method

        if (INTERSECTED != intersects[0].object) {

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);
            console.log(INTERSECTED);

        }

    } else {

        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

        INTERSECTED = null;

    }

    renderer.render(scene, camera);


}

function updatePhysics(deltaTime) {

    physicsWorld.stepSimulation(deltaTime, 10);

    // Update objects
    for (let i = 0, il = dynamicObjects.length; i < il; i++) {

        const objThree = dynamicObjects[i];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if (ms) {

            ms.getWorldTransform(transformAux1);
            const p = transformAux1.getOrigin();
            const q = transformAux1.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

        }

    }
}
function saveCamera() {
    posCameraX = camera.position.x;
    posCameraY = camera.position.y;
    posCameraZ = camera.position.z;
    rotCameraX = camera.rotation.x;
    rotCameraY = camera.rotation.y;
    rotCameraZ = camera.rotation.z;
}
function loadCamera() {
    camera.position.x = posCameraX;
    camera.position.y = posCameraY;
    camera.position.z = posCameraZ;
    camera.rotation.x = rotCameraX;
    camera.rotation.y = rotCameraY;
    camera.rotation.z = rotCameraZ;
}

