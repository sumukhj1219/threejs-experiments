"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import holographicVertexShader from "@/shaders/holographic/vertex.glsl"
import holographicFragmentShader from "@/shaders/holographic/fragment.glsl"
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";


export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);


    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth /
      containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      vertexShader: holographicVertexShader,
      fragmentShader: holographicFragmentShader,
      uniforms: {
        uTime: new THREE.Uniform(0),
        uColor: new THREE.Uniform(new THREE.Color("#03a5fc"))
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    new GLTFLoader().load("/models/vader.glb", (gltf) => {
      const model = gltf.scene;

      model.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.material = material;
          mesh.frustumCulled = false;
          mesh.geometry.computeVertexNormals();
        }
      });
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      const maxAxis = Math.max(size.x, size.y, size.z);
      model.scale.multiplyScalar(1 / maxAxis);
      scene.add(model);
    });




    // Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);


    //Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();


    // Animation loop
    const clock = new THREE.Clock()
    let frameId: number;
    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      material.uniforms.uTime.value = elapsedTime

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

    // Cleanup (important for Next.js route changes)
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);

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
