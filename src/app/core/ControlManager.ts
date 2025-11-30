import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three/webgpu";

export class ControlsManager {
  public controls: OrbitControls;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    enableConstraints: boolean = true
  ) {
    this.controls = new OrbitControls(camera, domElement);
    this.setupControls(enableConstraints);
  }

  public setupControls(enableConstraints: boolean) {
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.dampingFactor = 0.25;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 1000;

    if (enableConstraints) {
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI / 2;
      this.controls.minAzimuthAngle = Math.PI / 2;
      this.controls.maxAzimuthAngle = Math.PI / 2;
    }
  }

  public update() {
    this.controls.update();
  }
}
