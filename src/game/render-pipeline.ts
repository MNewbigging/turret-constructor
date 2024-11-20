import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";

export class RenderPipeline {
  private effectComposer: EffectComposer;
  private renderPass: RenderPass;
  private outlinePass: OutlinePass;
  private renderer: THREE.WebGLRenderer;

  private canvasSize = new THREE.Vector2();
  private renderSize = new THREE.Vector2();

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera
  ) {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 0.8;

    // Add canvas to dom
    const canvas = this.canvas;
    document.body.appendChild(canvas);

    // Setup pipeline
    const rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.FloatType,
    });
    this.effectComposer = new EffectComposer(this.renderer, rt);

    // Initial render acts as input for next pass
    this.renderPass = new RenderPass(scene, camera);
    this.effectComposer.addPass(this.renderPass);

    // Outline pass
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(this.canvas.clientWidth, this.canvas.clientHeight),
      scene,
      camera
    );
    this.outlinePass.edgeStrength = 10;
    this.outlinePass.edgeThickness = 0.25;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.visibleEdgeColor.set("#ffffff");
    this.effectComposer.addPass(this.outlinePass);

    // This corrects the output from the outline pass for srgbe encoding
    this.effectComposer.addPass(new OutputPass());
  }

  get canvas() {
    return this.renderer.domElement;
  }

  render(dt: number) {
    this.canvasSize.set(this.canvas.clientWidth, this.canvas.clientHeight);

    if (!this.renderSize.equals(this.canvasSize)) {
      this.renderSize.copy(this.canvasSize);

      this.renderer.setSize(this.renderSize.x, this.renderSize.y, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.effectComposer.setSize(this.renderSize.x, this.renderSize.y);

      this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    this.effectComposer.render(dt);
  }

  outlineObject(object: THREE.Object3D) {
    this.outlinePass.selectedObjects.push(object);
  }

  clearOutlines() {
    this.outlinePass.selectedObjects = [];
  }
}
