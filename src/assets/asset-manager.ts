import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { ModelAsset, TextureAsset, AnimationAsset } from "./asset-names";

export class AssetManager {
  private models = new Map<ModelAsset, THREE.Group>();
  textures = new Map<TextureAsset, THREE.Texture>();
  animations = new Map<AnimationAsset, THREE.AnimationClip>();

  private loadingManager = new THREE.LoadingManager();
  private fbxLoader = new FBXLoader(this.loadingManager);
  private rgbeLoader = new RGBELoader(this.loadingManager);
  private textureLoader = new THREE.TextureLoader(this.loadingManager);

  applyModelTexture(model: THREE.Object3D, textureName: TextureAsset) {
    const texture = this.textures.get(textureName);
    if (!texture) {
      return;
    }

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
      }
    });
  }

  getTexture(name: TextureAsset) {
    return this.textures.get(name) ?? null;
  }

  applyTurretMaterial(mesh: THREE.Object3D, colour: TextureAsset) {
    const material = new THREE.MeshPhysicalMaterial();
    material.map = this.getTexture(colour);
    material.normalMap = this.getTexture(TextureAsset.TurretsNormal);
    material.aoMap = this.getTexture(TextureAsset.TurretsAO);
    material.roughnessMap = this.getTexture(TextureAsset.TurretsRoughness);
    material.metalness = 1;
    material.emissiveMap = this.getTexture(TextureAsset.TurretsEmission);
    material.emissiveIntensity = 10;
    material.emissive = new THREE.Color(0xff0000);

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
  }

  getModel(name: ModelAsset): THREE.Object3D {
    const model = this.models.get(name);
    if (model) {
      return SkeletonUtils.clone(model);
    }

    // Ensure we always return an object 3d
    return new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial({ color: "red" })
    );
  }

  load(): Promise<void> {
    this.loadModels();
    this.loadTextures();
    this.loadAnimations();

    return new Promise((resolve) => {
      this.loadingManager.onLoad = () => {
        // Perform any setup on assets before completing
        this.prepareHdri();

        resolve();
      };
    });
  }

  private loadModels() {
    Object.values(ModelAsset).forEach((asset: ModelAsset) =>
      this.loadModel(asset)
    );
  }

  private loadTextures() {
    Object.values(TextureAsset).forEach((asset: TextureAsset) => {
      this.loadTexture(asset);
    });
  }

  private loadAnimations() {
    Object.values(AnimationAsset).forEach((filename) =>
      this.loadAnimation(filename)
    );
  }

  private loadModel(
    filename: ModelAsset,
    onLoad?: (group: THREE.Group) => void
  ) {
    const path = `${getPathPrefix()}/models/${filename}`;
    const url = getUrl(path);

    const filetype = filename.split(".")[1];

    // FBX
    if (filetype === "fbx") {
      this.fbxLoader.load(url, (group: THREE.Group) => {
        onLoad?.(group);
        this.models.set(filename, group);
      });

      return;
    } else {
      console.warn("cannot load this one", filename);
    }
  }

  private loadTexture(
    filename: TextureAsset,
    onLoad?: (texture: THREE.Texture) => void
  ) {
    const path = `${getPathPrefix()}/textures/${filename}`;
    const url = getUrl(path);

    const filetype = filename.split(".")[1];
    const loader = filetype === "png" ? this.textureLoader : this.rgbeLoader;

    loader.load(url, (texture) => {
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      onLoad?.(texture);
      this.textures.set(filename, texture);
    });
  }

  private loadAnimation(filename: AnimationAsset) {
    const path = `${getPathPrefix()}/anims/${filename}`;
    const url = getUrl(path);

    this.fbxLoader.load(url, (group) => {
      if (group.animations.length) {
        const clip = group.animations[0];
        clip.name = filename;
        this.animations.set(filename, clip);
      }
    });
  }

  private prepareHdri() {
    const hdri = this.getTexture(TextureAsset.HDRI)!;
    hdri.mapping = THREE.EquirectangularReflectionMapping;
  }
}

export const assetManager = new AssetManager();

function getPathPrefix() {
  // Using template strings to create url paths breaks on github pages
  // We need to manually add the required /repo/ prefix to the path if not on localhost
  return location.hostname === "localhost" ? "" : "/turret-constructor";
}

function getUrl(path: string) {
  return new URL(path, import.meta.url).href;
}
