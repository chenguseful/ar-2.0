var renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.body.appendChild(renderer.domElement);

var onRenderFcts = [];
var scene = new THREE.Scene();
var ambient = new THREE.AmbientLight(0x666666);
scene.add(ambient);

var directctionalLight = new THREE.DirectionalLight(0x887766);
directctionalLight.position.set(-1, 1, 1).normalize();
scene.add(directctionalLight);

var camera = new THREE.Camera();
scene.add(camera);

var arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam'
})

arToolkitSource.init(function onReady() {
    onResize();
})

window.addEventListener('resize', function () {
    onResize();
})

function onResize() {
    arToolkitSource.onResizeElement()
    arToolkitSource.copyElementSizeTo(renderer.domElement)
    if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
}

var arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: '../data/camera_para.dat',
    detectionMode: 'mono',
    canvasWidth: 80 * 3,
    canvasHeight: 60 * 3,
    maxDetectionRate: 30
})
arToolkitContext.init(function onCompleted() {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});
onRenderFcts.push(function () {
    if (arToolkitSource.ready == false) return;

    arToolkitContext.update(arToolkitSource.domElement)
})

var markerRoot = new THREE.Group();
scene.add(markerRoot);

var markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: '../pattern-files/pattern-logo.patt',
})
var smoothedRoot = new THREE.Group();
scene.add(smoothedRoot);
var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
    lerpPosition: 0.4,
    lerpQuaternion: 0.3,
    lerpScale: 1
})
onRenderFcts.push(function () {
    smoothedControls.update(markerRoot)
})
var arWorldRoot = smoothedRoot

var loader = new THREE.GLTFLoader();
var mixer
loader.load('../models/dancer/scene.gltf', function (gltf) {
    // var animations = gltf.animations;
    var obj = gltf.scene;
    obj.rotation.x = Math.PI;
    obj.rotation.z = Math.PI;
    obj.scale.set(0.5, 0.5, 0.5);
    // mixer = new THREE.AnimationMixer(obj);
    // mixer.clipAction(animations[0]).play();

    arWorldRoot.add(obj);
    onRenderFcts.push(function () {
        obj.rotation.z += 0.02 * Math.PI;
    })
});

var stats = new Stats();
document.body.appendChild(stats.dom);

onRenderFcts.push(function () {
    renderer.render(scene, camera);
    stats.update();
})

var lastTimeMsec = null;
var clock = new THREE.Clock();

requestAnimationFrame(function animate(nowMsec) {
    requestAnimationFrame(animate);

    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    })

    // var delta = clock.getDelta();
    // if (mixer !== undefined) {
    //     mixer.update(delta);
    // }
})