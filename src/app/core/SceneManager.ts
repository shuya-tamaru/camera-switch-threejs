import * as THREE from "three/webgpu";

import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

export class SceneManager {
  public scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
    this.loadEnvironment();
  }

  private loadEnvironment() {
    new HDRLoader().load("/hdr.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = new THREE.Color("#fff");
      this.scene.backgroundBlurriness = 0.9;
    });
  }

  public add(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D) {
    this.scene.remove(object);
  }
}
