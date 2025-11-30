import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";

export interface FrustumUpdateResult {
  shouldSwitch: boolean;
  targetType?: "perspective" | "orthographic";
  overrideParams?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  overridePosition?: THREE.Vector3;
  overrideFov?: number;
}

export class DollyZoomManager {
  private static readonly DEFAULT_FOV = 45;
  private static readonly MIN_FOV = 7;
  private static readonly TRANSITION_ANGLE = 0.2;
  private static readonly SWITCH_ANGLE = 0.01;

  private static frustumHeightAtDistance(
    camera: THREE.PerspectiveCamera,
    distance: number
  ) {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    return Math.tan(vFov / 2) * distance * 2;
  }

  static updateFrustum(
    orbitControls: OrbitControls,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  ): FrustumUpdateResult {
    const polarAngle = orbitControls.getPolarAngle();
    const isPerspective = camera instanceof THREE.PerspectiveCamera;

    //swtich to orthographic camera
    if (polarAngle < this.SWITCH_ANGLE && isPerspective) {
      const distance = camera.position.distanceTo(orbitControls.target);
      const targetViewHeight = this.frustumHeightAtDistance(camera, distance);
      const targetViewWidth = targetViewHeight * camera.aspect;
      const halfHeight = targetViewHeight / 2;
      const halfWidth = targetViewWidth / 2;

      return {
        shouldSwitch: true,
        targetType: "orthographic",
        overrideParams: {
          top: halfHeight,
          bottom: -halfHeight,
          left: -halfWidth,
          right: halfWidth,
        },
      };
    } else if (polarAngle >= this.SWITCH_ANGLE && !isPerspective) {
      //switch to perspective camera
      const targetFov = this.MIN_FOV;
      const targetFovHalfRad = THREE.MathUtils.degToRad(targetFov / 2);
      const targetTan = Math.tan(targetFovHalfRad);
      const orthoHeight = (camera.top - camera.bottom) / camera.zoom;
      const newDist = orthoHeight / (2 * targetTan);

      const position = camera.position.clone();
      const target = orbitControls.target.clone();
      const direction = new THREE.Vector3()
        .subVectors(position, target)
        .normalize();
      const newPosition = target.add(direction.multiplyScalar(newDist));

      return {
        shouldSwitch: true,
        targetType: "perspective",
        overridePosition: newPosition,
        overrideFov: targetFov,
      };
    }

    //dolly zoom transition
    if (polarAngle < this.TRANSITION_ANGLE && isPerspective) {
      //transition between orthographic and perspective camera

      const t =
        (polarAngle - this.SWITCH_ANGLE) /
        (this.TRANSITION_ANGLE - this.SWITCH_ANGLE);

      const clampedT = Math.max(0, Math.min(1, t));
      const targetFov = THREE.MathUtils.lerp(
        this.MIN_FOV,
        this.DEFAULT_FOV,
        clampedT
      );

      const targetFovHalfRad = THREE.MathUtils.degToRad(targetFov / 2);
      const targetTan = Math.tan(targetFovHalfRad);

      const currentFov = camera.fov;
      const currentDist = camera.position.distanceTo(orbitControls.target);
      const currentFovHalfRad = THREE.MathUtils.degToRad(currentFov / 2);
      const currentTan = Math.tan(currentFovHalfRad);

      //Division by zero prevention
      if (targetTan > 0) {
        const newDist = currentDist * (currentTan / targetTan);
        const direction = new THREE.Vector3()
          .subVectors(camera.position, orbitControls.target)
          .normalize();
        camera.position
          .copy(orbitControls.target)
          .add(direction.multiplyScalar(newDist));
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    } else if (isPerspective) {
      //normal zone
      if (camera.fov !== this.DEFAULT_FOV) {
        const currentFov = camera.fov;
        const currentDist = camera.position.distanceTo(orbitControls.target);

        const targetFov = this.DEFAULT_FOV;
        const currentFovHalfRad = THREE.MathUtils.degToRad(currentFov / 2);
        const currentTan = Math.tan(currentFovHalfRad);
        const targetFovHalfRad = THREE.MathUtils.degToRad(targetFov / 2);
        const targetTan = Math.tan(targetFovHalfRad);

        const newDist = currentDist * (currentTan / targetTan);

        const direction = new THREE.Vector3()
          .subVectors(camera.position, orbitControls.target)
          .normalize();

        camera.position
          .copy(orbitControls.target)
          .add(direction.multiplyScalar(newDist));

        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }

    return { shouldSwitch: false };
  }
}
