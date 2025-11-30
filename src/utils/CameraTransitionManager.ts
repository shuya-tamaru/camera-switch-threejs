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

export class CameraTransitionManager {
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

    // Camera type switching check (early return)
    if (isPerspective && polarAngle < this.SWITCH_ANGLE) {
      // Switch from perspective to orthographic
      return this.switchToOrthographic(camera, orbitControls);
    }

    if (!isPerspective && polarAngle >= this.SWITCH_ANGLE) {
      // Switch from orthographic to perspective
      return this.switchToPerspective(camera, orbitControls);
    }

    // Perspective camera transition processing
    if (isPerspective) {
      if (polarAngle < this.TRANSITION_ANGLE) {
        // Transition zone: dolly zoom
        this.applyDollyZoomTransition(camera, orbitControls, polarAngle);
      } else if (camera.fov !== this.DEFAULT_FOV) {
        // Normal zone: reset to default FOV
        this.resetToDefaultFov(camera, orbitControls);
      }
    }

    return { shouldSwitch: false };
  }

  private static switchToOrthographic(
    camera: THREE.PerspectiveCamera,
    orbitControls: OrbitControls
  ): FrustumUpdateResult {
    const distance = camera.position.distanceTo(orbitControls.target);
    const targetViewHeight = this.frustumHeightAtDistance(camera, distance);
    const targetViewWidth = targetViewHeight * camera.aspect;

    return {
      shouldSwitch: true,
      targetType: "orthographic",
      overrideParams: {
        top: targetViewHeight / 2,
        bottom: -targetViewHeight / 2,
        left: -targetViewWidth / 2,
        right: targetViewWidth / 2,
      },
    };
  }

  private static switchToPerspective(
    camera: THREE.OrthographicCamera,
    orbitControls: OrbitControls
  ): FrustumUpdateResult {
    const targetFov = this.MIN_FOV;
    const targetFovHalfRad = THREE.MathUtils.degToRad(targetFov / 2);
    const targetTan = Math.tan(targetFovHalfRad);
    const orthoHeight = (camera.top - camera.bottom) / camera.zoom;
    const newDist = orthoHeight / (2 * targetTan);

    const target = orbitControls.target.clone();
    const direction = new THREE.Vector3()
      .subVectors(camera.position, target)
      .normalize();
    const newPosition = target.add(direction.multiplyScalar(newDist));

    return {
      shouldSwitch: true,
      targetType: "perspective",
      overridePosition: newPosition,
      overrideFov: targetFov,
    };
  }

  private static applyDollyZoomTransition(
    camera: THREE.PerspectiveCamera,
    orbitControls: OrbitControls,
    polarAngle: number
  ): void {
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

    if (targetTan <= 0) return; // Division by zero prevention

    const currentFov = camera.fov;
    const currentDist = camera.position.distanceTo(orbitControls.target);
    const currentFovHalfRad = THREE.MathUtils.degToRad(currentFov / 2);
    const currentTan = Math.tan(currentFovHalfRad);

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

  private static resetToDefaultFov(
    camera: THREE.PerspectiveCamera,
    orbitControls: OrbitControls
  ): void {
    const currentFov = camera.fov;
    const currentDist = camera.position.distanceTo(orbitControls.target);
    const currentFovHalfRad = THREE.MathUtils.degToRad(currentFov / 2);
    const currentTan = Math.tan(currentFovHalfRad);
    const targetFovHalfRad = THREE.MathUtils.degToRad(this.DEFAULT_FOV / 2);
    const targetTan = Math.tan(targetFovHalfRad);

    const newDist = currentDist * (currentTan / targetTan);
    const direction = new THREE.Vector3()
      .subVectors(camera.position, orbitControls.target)
      .normalize();

    camera.position
      .copy(orbitControls.target)
      .add(direction.multiplyScalar(newDist));
    camera.fov = this.DEFAULT_FOV;
    camera.updateProjectionMatrix();
  }
}
