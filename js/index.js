var renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0);
//renderer setPiexRatio(2);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.body.appendChild(renderer.domElement);

//array of  functions for the rendering loop（渲染处理函数组初始化）
var onRenderFcts = [];

//init scene and camera
var scene = new THREE.Scene(); //初始化场景和环境

var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);

var directctionalLight = new THREE.DirectionalLight(0x887766);
directctionalLight.position.set(-1, 1, 1).normalize();
scene.add(directctionalLight);

//Initialize a basic camera

//Create a camera（初始化相机添加到场景）
var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
scene.add(camera);

//handle arToolkitSource（调用打开相机事件，由THREEx提供）
var arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam'
})

arToolkitSource.init(function onReady() {
    onResize();
})

//handle resize(处理重新调整大小后正常显示)
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

//create acToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
    //相机参数设置
    cameraParametersUrl: '../data/camera_para.dat',
    detectionMode: 'mono',
    canvasWidth: 80 * 3,
    canvasHeight: 60 * 3,
    maxDetectionRate: 30
})
//initialize it
arToolkitContext.init(function onCompleted() {
    //copy projection matrix to camera
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
});
//update artoolkit on every frame
onRenderFcts.push(function () {
    if (arToolkitSource.ready == false) return;

    arToolkitContext.update(arToolkitSource.domElement)
})

//Create a ArMakerControls
//创建一个Ar标记
var markerRoot = new THREE.Group(); //用threejs的点集合初始化。
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
onRenderFcts.push(function (delta) {
    smoothedControls.update(markerRoot)
})
smoothedControls.addEventListener('becameVisible', function () {
    console.log('becameVisible event notified')
})

//添加物体
var arWorldRoot = smoothedRoot

// var mesh = new THREE.AxisHelper();
// arWorldRoot.add(mesh);

var loader = new THREE.GLTFLoader();
var mixer
loader.load('../models/plane/scene.gltf', function (gltf) {
    // var animations = collada.animations;
    //调整对象状态
    var avatar = gltf.scene;
    // avatar.rotateX(-Math.PI/2);
    // avatar.rotation.z = Math.PI;
    // avatar.position.set(0,4,0)
    avatar.scale.set(10, 10, 10);
    // mixer = new THREE.AnimationMixer(avatar);
    // mixer.clipAction(animations[0]).play();

    arWorldRoot.add(avatar);
    // var action = mixer.clipAction(animations[0]).play();
});

//渲染率查看器
var stats = new Stats();
document.body.appendChild(stats.dom);

var clock = new THREE.Clock();
//renderer the scene
onRenderFcts.push(function () {
    renderer.render(scene, camera);
    stats.update();

    // var delta = clock.getDelta();

    // if (typeof mixer !== 'undefined') {

    //     mixer.update(delta);

    // }
})

//行程渲染事件环路
var lastTimeMsec = null;
requestAnimationFrame(function animate(nowMsec) {
    //keep looping
    requestAnimationFrame(animate);
    //measure time
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
    //call all each update function
    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    })
})