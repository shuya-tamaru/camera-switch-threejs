import * as THREE from "three";
import {
  type GLTF,
  GLTFLoader,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export class ModelLoader {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;

  constructor() {
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();

    this.dracoLoader.setDecoderPath("./draco/");
    this.dracoLoader.setDecoderConfig({ type: "js" });
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  public async load(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((material) => {
                    material.side = THREE.DoubleSide;
                    material.transparent = true;
                  });
                } else {
                  mesh.material.side = THREE.DoubleSide;
                  mesh.material.transparent = true;
                }
              }
            }
          });

          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          gltf.scene.position.sub(center);

          resolve(gltf);
        },
        (progress) => {
          console.log(
            `Loading model... ${(progress.loaded / progress.total) * 100}%`
          );
        },
        (error) => {
          console.error("An error happened loading the model:", error);
          reject(error);
        }
      );
    });
  }

  public dispose() {
    this.dracoLoader.dispose();
  }
}
