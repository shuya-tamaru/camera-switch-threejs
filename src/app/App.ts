import { CameraManager } from "./core/CameraManager";
import { ControlsManager } from "./core/ControlManager";
import { DollyZoomManager } from "./core/DollyZoomManager";
import { ModelLoader } from "./core/ModelLoader";
import { RendererManager } from "./core/RendererManager";
import { SceneManager } from "./core/SceneManager";
import * as THREE from "three";

export class App {
  private sceneManager!: SceneManager;
  private observerCameraManager!: CameraManager;
  private cameraManager!: CameraManager;
  private rendererManager!: RendererManager;
  private controlsManager!: ControlsManager;
  private observerControlsManager!: ControlsManager;
  private modelLoader!: ModelLoader;
  private cameraHelper!: THREE.CameraHelper;

  private border: HTMLElement | null = null;
  private leftViewDiv: HTMLElement | null = null;
  private rightViewDiv: HTMLElement | null = null;
  private animationId?: number;

  private width: number;
  private height: number;
  private aspect: number;

  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / 2 / this.height; // Half width aspect

    this.initApp();
  }

  private initApp() {
    this.initializeInstances();
    this.createBorder();
    this.addObjectsToScene();
    this.setupEventListeners();
    this.startAnimation();
  }

  private initializeInstances() {
    this.createBorder();
    this.createViewDivs();

    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager(this.aspect);

    this.cameraHelper = new THREE.CameraHelper(this.cameraManager.camera);
    this.cameraHelper.layers.set(1); // Hide from main camera (layer 0)
    const color = new THREE.Color("red");

    // @ts-ignore
    if (this.cameraHelper.setColors)
      this.cameraHelper.setColors(color, color, color, color, color);
    this.sceneManager.scene.add(this.cameraHelper);

    this.observerCameraManager = new CameraManager(this.aspect, "orthographic");
    this.observerCameraManager.camera.layers.enable(1); // Enable layer 1 for observer
    this.observerCameraManager.camera.position.set(1000, 40, 0);
    this.observerCameraManager.camera.lookAt(0, 0, 0);

    this.rendererManager = new RendererManager(this.width, this.height);
    this.controlsManager = new ControlsManager(
      this.cameraManager.camera,
      this.leftViewDiv!
    );

    this.observerControlsManager = new ControlsManager(
      this.observerCameraManager.camera,
      this.rightViewDiv!,
      false
    );
    // Observerカメラはズームのみ許可
    this.observerControlsManager.controls.enableRotate = false;
    this.observerControlsManager.controls.enablePan = false;
    this.observerControlsManager.controls.enableZoom = true;

    this.observerCameraManager.camera.position.set(0, 40, 1000);
    this.observerCameraManager.camera.lookAt(0, 0, 0);
    this.observerControlsManager.controls.update();

    this.modelLoader = new ModelLoader();
    this.modelLoader.load("/model.glb").then((gltf) => {
      this.sceneManager.scene.add(gltf.scene);
    });
  }

  private createBorder() {
    this.border = document.createElement("div");
    this.border.style.position = "absolute";
    this.border.style.top = "0";
    this.border.style.left = "50%";
    this.border.style.width = "2px";
    this.border.style.height = "100%";
    this.border.style.backgroundColor = "#000";
    this.border.style.transform = "translateX(-50%)";
    this.border.style.zIndex = "10";
    document.body.appendChild(this.border);
  }

  private createViewDivs() {
    // Left View Div
    this.leftViewDiv = document.createElement("div");
    this.leftViewDiv.style.position = "absolute";
    this.leftViewDiv.style.top = "0";
    this.leftViewDiv.style.left = "0";
    this.leftViewDiv.style.width = "50%";
    this.leftViewDiv.style.height = "100%";
    this.leftViewDiv.style.zIndex = "5"; // Canvasより上、Borderより下
    document.body.appendChild(this.leftViewDiv);

    // Right View Div
    this.rightViewDiv = document.createElement("div");
    this.rightViewDiv.style.position = "absolute";
    this.rightViewDiv.style.top = "0";
    this.rightViewDiv.style.left = "50%";
    this.rightViewDiv.style.width = "50%";
    this.rightViewDiv.style.height = "100%";
    this.rightViewDiv.style.zIndex = "5";
    document.body.appendChild(this.rightViewDiv);
  }

  private addObjectsToScene(): void {}

  private handleResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / 2 / this.height;

    this.cameraManager.updateAspect(this.aspect);
    this.observerCameraManager.updateAspect(this.aspect);

    this.rendererManager.resize(this.width, this.height);
  };

  private setupEventListeners(): void {
    window.addEventListener("resize", this.handleResize);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controlsManager.update();
    this.observerControlsManager.update();
    if (this.cameraHelper) this.cameraHelper.update();

    const renderer = this.rendererManager.renderer;
    const result = DollyZoomManager.updateFrustum(
      this.controlsManager.controls,
      this.cameraManager.camera
    );

    if (result.shouldSwitch && result.targetType) {
      this.cameraManager.switchCamera(
        result.targetType,
        result.overrideParams,
        result.overridePosition,
        result.overrideFov
      );
      this.controlsManager.controls.object = this.cameraManager.camera;

      // Helperの更新
      this.sceneManager.scene.remove(this.cameraHelper);
      this.cameraHelper = new THREE.CameraHelper(this.cameraManager.camera);
      this.cameraHelper.layers.set(1);
      const color = new THREE.Color("red");
      // @ts-ignore
      if (this.cameraHelper.setColors)
        this.cameraHelper.setColors(color, color, color, color, color);
      this.sceneManager.scene.add(this.cameraHelper);
    }

    renderer.setScissorTest(true);

    // Left View (Main Camera)
    renderer.setScissor(0, 0, this.width / 2, this.height);
    renderer.setViewport(0, 0, this.width / 2, this.height);
    this.rendererManager.render(
      this.sceneManager.scene,
      this.cameraManager.camera
    );

    // Right View (Observer Camera)
    renderer.setScissor(this.width / 2, 0, this.width / 2, this.height);
    renderer.setViewport(this.width / 2, 0, this.width / 2, this.height);
    this.rendererManager.render(
      this.sceneManager.scene,
      this.observerCameraManager.camera
    );

    renderer.setScissorTest(false);
  };

  private startAnimation(): void {
    this.animate();
  }

  public cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.handleResize);
    if (this.border) {
      this.border.remove();
    }
  }
}
