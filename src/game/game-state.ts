import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPipeline } from "./render-pipeline";
import { assetManager } from "../assets/asset-manager";
import { TextureAsset, ModelAsset } from "../assets/asset-names";

export class GameState {
  private renderPipeline: RenderPipeline;
  private clock = new THREE.Clock();

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera();
  private controls: OrbitControls;

  constructor() {
    this.setupCamera();
    this.renderPipeline = new RenderPipeline(this.scene, this.camera);
    this.controls = this.setupControls();

    this.setupScene();
    this.setupLights();
    this.setupObjects();

    // Start game
    this.update();
  }

  private setupCamera() {
    this.camera.fov = 75;
    this.camera.far = 500;
    this.camera.position.set(0, 1.5, 5);
  }

  private setupControls() {
    const controls = new OrbitControls(this.camera, this.renderPipeline.canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.target.set(0, 1, 0);

    return controls;
  }

  private setupScene() {
    this.scene.background = new THREE.Color("#1680AF");
    const envMap = assetManager.textures.get(TextureAsset.HDRI)!;
    this.scene.environment = envMap;
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(undefined, 1);
    this.scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(undefined, Math.PI);
    directLight.position.copy(new THREE.Vector3(0.75, 1, 0.75).normalize());
    this.scene.add(directLight);
  }

  private setupObjects() {
    // const box = assetManager.getModel(ModelAsset.BoxSmall);
    // this.scene.add(box);

    const turretBase = assetManager.getModel(ModelAsset.BaseTurretLvl0);
    assetManager.applyModelTexture(turretBase, TextureAsset.TurretsAlbedoBlack);
    turretBase.scale.multiplyScalar(0.01);
    this.scene.add(turretBase);
  }

  private update = () => {
    requestAnimationFrame(this.update);

    const dt = this.clock.getDelta();

    this.controls.update();

    this.renderPipeline.render(dt);
  };
}
