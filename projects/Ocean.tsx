"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import oceanVertexShader from "@/shaders/ocean/vertex.glsl"
import oceanFragmentShader from "@/shaders/ocean/fragment.glsl"
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as dat from "dat.gui";

export default function Ocean() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("white");


    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth /
      containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.localClippingEnabled = true;
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    let geometry = new THREE.PlaneGeometry(10, 10, 256, 256)
    geometry.rotateX(-Math.PI / 2)
    geometry = mergeVertices(geometry)
    geometry.computeTangents()

    //Uniforms
    const uniforms = {
      uTime: new THREE.Uniform(0),
      uFrequency: { value: 0.5 },
      uAmplitude: { value: 1.0 },
      uWorleyNoise: { value: new THREE.TextureLoader().load("/noise/worley.jpg") },
      uPerlinNoise: { value: new THREE.TextureLoader().load("/noise/perlin.png") },
      uSimplexNoise: { value: new THREE.TextureLoader().load("/noise/simplex.png") },
      uFractalNoise: { value: new THREE.TextureLoader().load("/noise/fractal.jpg") },
      uDiffuseNoise: { value: new THREE.TextureLoader().load("/noise/diffuse.jpg") },
      uColor1: { value: new THREE.Vector3(0, 1, 1) },
      uColor2: { value: new THREE.Vector3(51 / 255, 227 / 255, 189 / 255) },
      uColor3: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      uPowerFactor: { value: 0.5 }
    }

    const material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,

      vertexShader: oceanVertexShader,
      fragmentShader: oceanFragmentShader,
      uniforms: uniforms,
      side: THREE.DoubleSide,
      transparent: false,
      wireframe: false
    });

    const ocean = new THREE.Mesh(geometry, material)
    scene.add(ocean)

    //Bottle glb
    new GLTFLoader().load("/models/bottle.glb", (glb) => {
      const model = glb.scene
      model.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1,
            thickness: 0.5,
            ior: 1.5,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        }
      })
      // scene.add(model)
    })

    //Clipper
    // const clipPlane = new THREE.Plane(
    //   new THREE.Vector3(-1, 0, 0),
    //   0
    // );
    // material.clippingPlanes = [clipPlane];
    // material.clipIntersection = true;

    // Lights
    const directionalLight = new THREE.DirectionalLight("0xffffff", 1);
    directionalLight.position.set(3, 3, 3);
    scene.add(directionalLight);


    //Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    //GUI
    const gui = new dat.GUI();
    gui.add(uniforms.uFrequency, "value", 0, 5, 0.01)
      .name("uFrequency");
    gui.add(uniforms.uAmplitude, "value", 0, 5, 0.01)
      .name("uAmplitude");
    gui.add(uniforms.uPowerFactor, "value", 0, 5, 0.05)
      .name("uPowerFactor");

    const guiParams = {
      color1: { r: 0, g: 128, b: 128 },
      color2: { r: 0, g: 64, b: 191 },
      color3: { r: 255, g: 255, b: 255 },
    };

    gui.addColor(guiParams, "color1").name("Color 1").onChange((val: any) => {
      uniforms.uColor1.value.set(val.r / 255, val.g / 255, val.b / 255);
    });

    gui.addColor(guiParams, "color2").name("Color 2").onChange((val: any) => {
      uniforms.uColor2.value.set(val.r / 255, val.g / 255, val.b / 255);
    });

    gui.addColor(guiParams, "color3").name("Color 3").onChange((val: any) => {
      uniforms.uColor3.value.set(val.r / 255, val.g / 255, val.b / 255);
    });

    // Animation loop
    const clock = new THREE.Clock()
    let frameId: number;
    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      uniforms.uTime.value = elapsedTime

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      gui.destroy();
      material.dispose();
      renderer.dispose();

      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </main>
  );
}
