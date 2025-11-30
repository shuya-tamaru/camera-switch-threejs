import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ModelLoader } from "./utils/ModelLoader";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { DollyZoomManager } from "./utils/DollyZoomManager";

const scene = new THREE.Scene();
const aspect = (window.innerWidth * 0.5) / window.innerHeight;
const frustumSize = 200;

let mainCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

const mainCameraPerspective = new THREE.PerspectiveCamera(45, aspect, 0.1, 800);
mainCameraPerspective.position.set(100, 40, 0);
const mainViewDiv = document.createElement("div");
mainViewDiv.style.position = "absolute";
mainViewDiv.style.top = "0";
mainViewDiv.style.left = "0";
mainViewDiv.style.width = "50%";
mainViewDiv.style.height = "100%";
mainViewDiv.style.zIndex = "5";
mainViewDiv.style.borderRight = "1px solid #666";
document.body.appendChild(mainViewDiv);

const mainCameraOrthographic = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  1200
);

mainCamera = mainCameraPerspective;

let cameraHelper = new THREE.CameraHelper(mainCamera);
const color = new THREE.Color("red");
// @ts-ignore
if (cameraHelper.setColors)
  cameraHelper.setColors(color, color, color, color, color);
cameraHelper.layers.set(1);
scene.add(cameraHelper);

const observerCamera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0.1,
  2000
);
observerCamera.layers.enable(0);
observerCamera.layers.enable(1);
observerCamera.position.set(0, 40, 1000);
observerCamera.lookAt(0, 0, 0);

const observerViewDiv = document.createElement("div");
observerViewDiv.style.position = "absolute";
observerViewDiv.style.top = "0";
observerViewDiv.style.left = "50%";
observerViewDiv.style.width = "50%";
observerViewDiv.style.height = "100%";
observerViewDiv.style.zIndex = "5";
document.body.appendChild(observerViewDiv);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const mainControls = new OrbitControls(mainCamera, mainViewDiv);
mainControls.enableDamping = true;
mainControls.minPolarAngle = 0;
mainControls.maxPolarAngle = Math.PI / 2;
mainControls.minAzimuthAngle = Math.PI / 2;
mainControls.maxAzimuthAngle = Math.PI / 2;

const observerControls = new OrbitControls(observerCamera, observerViewDiv);
observerControls.enableDamping = false;
observerControls.enablePan = false;
observerControls.enableRotate = false;
observerControls.enableZoom = true;

const hdrLoader = new HDRLoader();
hdrLoader.load("./hdr.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = new THREE.Color("#fff");
});

const modelLoader = new ModelLoader();
modelLoader.load("./model.glb").then((gltf) => {
  scene.add(gltf.scene);
});

//resize
function resize() {
  const newAspect = (window.innerWidth * 0.5) / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
  const mainIsPerspective = mainCamera instanceof THREE.PerspectiveCamera;
  if (mainIsPerspective) {
    mainCameraPerspective.aspect = newAspect;
    mainCameraPerspective.updateProjectionMatrix();
  } else {
    mainCameraOrthographic.left = (frustumSize * newAspect) / -2;
    mainCameraOrthographic.right = (frustumSize * newAspect) / 2;
    mainCameraOrthographic.top = frustumSize / 2;
    mainCameraOrthographic.bottom = frustumSize / -2;
    mainCameraOrthographic.updateProjectionMatrix();
  }

  // OrthographicCameraの視錐台を更新
  observerCamera.left = (frustumSize * newAspect) / -2;
  observerCamera.right = (frustumSize * newAspect) / 2;
  observerCamera.top = frustumSize / 2;
  observerCamera.bottom = frustumSize / -2;
  observerCamera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);

function animate() {
  requestAnimationFrame(animate);
  mainControls.update();
  observerControls.update();
  cameraHelper.update();

  const result = DollyZoomManager.updateFrustum(mainControls, mainCamera);
  if (result.shouldSwitch && result.targetType === "orthographic") {
    mainCameraOrthographic.left = result.overrideParams!.left;
    mainCameraOrthographic.right = result.overrideParams!.right;
    mainCameraOrthographic.top = result.overrideParams!.top;
    mainCameraOrthographic.bottom = result.overrideParams!.bottom;

    mainCameraOrthographic.position.copy(mainCamera.position);
    mainCameraOrthographic.quaternion.copy(mainCamera.quaternion);
    mainCameraOrthographic.updateProjectionMatrix();

    mainCamera = mainCameraOrthographic;
    mainControls.object = mainCamera;

    scene.remove(cameraHelper);
    const newCameraHelper = new THREE.CameraHelper(mainCamera);
    newCameraHelper.setColors(color, color, color, color, color);
    newCameraHelper.layers.set(1);
    scene.add(newCameraHelper);
    cameraHelper = newCameraHelper;
  } else if (result.shouldSwitch && result.targetType === "perspective") {
    // PerspectiveCameraのパラメータを更新
    mainCameraPerspective.fov = result.overrideFov!;
    mainCameraPerspective.position.copy(result.overridePosition!);
    mainCameraPerspective.quaternion.copy(mainCamera.quaternion);
    mainCameraPerspective.updateProjectionMatrix();

    // 参照を切り替え
    mainCamera = mainCameraPerspective;
    mainControls.object = mainCamera;

    // CameraHelperを更新
    scene.remove(cameraHelper);
    const newCameraHelper = new THREE.CameraHelper(mainCamera);
    newCameraHelper.setColors(color, color, color, color, color);
    newCameraHelper.layers.set(1);
    scene.add(newCameraHelper);
    cameraHelper = newCameraHelper;
  }
  renderer.setScissorTest(true);
  renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
  renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
  renderer.render(scene, mainCamera);
  renderer.setScissor(
    window.innerWidth / 2,
    0,
    window.innerWidth / 2,
    window.innerHeight
  );
  renderer.setViewport(
    window.innerWidth / 2,
    0,
    window.innerWidth / 2,
    window.innerHeight
  );
  renderer.render(scene, observerCamera);
  renderer.setScissorTest(false);
}

animate();
