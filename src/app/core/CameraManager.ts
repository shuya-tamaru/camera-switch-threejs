import * as THREE from "three/webgpu";

export class CameraManager {
  public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private frustumSize: number = 200;

  constructor(
    aspect: number,
    type: "perspective" | "orthographic" = "perspective"
  ) {
    if (type === "perspective") {
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 800);
    } else {
      this.camera = new THREE.OrthographicCamera(
        (this.frustumSize * aspect) / -2,
        (this.frustumSize * aspect) / 2,
        this.frustumSize / 2,
        this.frustumSize / -2,
        0.1,
        2000
      );
    }
    this.setInitialPosition();
  }

  private setInitialPosition() {
    const isMobile =
      window.innerWidth <= 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      this.camera.position.set(212, -245, 107.6);
    } else {
      this.camera.position.set(100, 40, 0);
    }
  }

  public updateAspect(aspect: number): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = (this.frustumSize * aspect) / -2;
      this.camera.right = (this.frustumSize * aspect) / 2;
      this.camera.top = this.frustumSize / 2;
      this.camera.bottom = this.frustumSize / -2;
      this.camera.updateProjectionMatrix();
    }
  }

  // CameraManager.ts のイメージ
  public switchCamera(
    type: "perspective" | "orthographic",
    overrideParams?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    },
    overridePosition?: THREE.Vector3,
    overrideFov?: number
  ): void {
    const oldCamera = this.camera;
    const aspect =
      oldCamera instanceof THREE.PerspectiveCamera
        ? oldCamera.aspect
        : (oldCamera as THREE.OrthographicCamera).right /
          (oldCamera as THREE.OrthographicCamera).top; // Approximate aspect

    if (type === "orthographic") {
      let left, right, top, bottom;

      if (overrideParams) {
        left = overrideParams.left;
        right = overrideParams.right;
        top = overrideParams.top;
        bottom = overrideParams.bottom;
      } else {
        left = (this.frustumSize * aspect) / -2;
        right = (this.frustumSize * aspect) / 2;
        top = this.frustumSize / 2;
        bottom = this.frustumSize / -2;
      }

      this.camera = new THREE.OrthographicCamera(
        left,
        right,
        top,
        bottom,
        0.1,
        1200
      );
    } else {
      const fov = overrideFov || 45;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 800);
    }

    this.camera.position.copy(overridePosition || oldCamera.position);
    this.camera.quaternion.copy(oldCamera.quaternion);
    this.camera.updateProjectionMatrix();
  }
}
