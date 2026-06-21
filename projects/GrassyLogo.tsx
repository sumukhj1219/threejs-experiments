"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import grassVertex from "@/shaders/grass/grass.vertex.glsl";
import grassFragment from "@/shaders/grass/grass.frag.glsl";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default function GrassyLogo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parameters
    const PLANE_SIZE = 30;
    const BLADE_COUNT = 250000;
    const BLADE_WIDTH = 0.1;
    const BLADE_HEIGHT = 0.8;
    const BLADE_HEIGHT_VARIATION = 0.6;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("white")

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 10);

    const dirLight = new THREE.DirectionalLight(new THREE.Color("#ebe3cc"), 3)
    dirLight.position.set(10, 10, 10)
    scene.add(dirLight)

    const hemiLight = new THREE.HemisphereLight("#75cfe6", "#b0f0aa", 3)
    scene.add(hemiLight)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 1.1;
    controls.maxPolarAngle = 1.1;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);

    // Textures
    const loader = new THREE.TextureLoader();
    const grassTexture = loader.load("/textures/grass.jpg");
    const cloudTexture = loader.load("/textures/cloud.jpg");
    cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;


    // Uniforms
    const uniforms = {
      textures: { value: [grassTexture, cloudTexture] },
      iTime: { value: 0.0 }
    } as any;

    const grassMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: grassVertex,
      fragmentShader: grassFragment,
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    });

    const glbLoader = new GLTFLoader()
    glbLoader.load("/models/onepiece.glb", (glb) => {
      const model = glb.scene
      model.traverse((node: any) => {
        if (node.isMesh && node.name === "Circle") {
          node.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#c2732f"),
            side: THREE.DoubleSide,
            metalness: 0,
            roughness: 1,
            vertexColors: false,
            map:cloudTexture
          })
          node.material.needsUpdate = true
        }
        if (node.isMesh && node.name === "Cube") {
          node.material = new THREE.MeshStandardMaterial({
            color: "#a5a8a5",
            side: THREE.DoubleSide,
            metalness: 0,
            roughness: 1,
            vertexColors: false,
            
          })
          node.material.needsUpdate = true
        }
        if (node.isMesh && node.name === "Circle001") {
          const newMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#f50202"),
            metalness: 0,
            roughness: 1,
            vertexColors: false,
            map:cloudTexture
          })

          if (Array.isArray(node.material)) {
            node.material = node.material.map(() => newMaterial.clone())
          } else {
            node.material = newMaterial
          }

          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => mat && (mat.needsUpdate = true))
            } else {
              node.material.needsUpdate = true
            }
          }
        }
        node.castShadow = true
        node.receiveShadow = true
      })
      scene.add(model)
    })

    // Helpers: range conversion
    function convertRange(val: number, oldMin: number, oldMax: number, newMin: number, newMax: number) {
      return (((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
    }

    function generateBlade(center: THREE.Vector3, vArrOffset: number, uv: number[]) {
      const MID_WIDTH = BLADE_WIDTH * 0.5;
      const TIP_OFFSET = 0.1;
      const height = BLADE_HEIGHT + (Math.random() * BLADE_HEIGHT_VARIATION);

      const yaw = Math.random() * Math.PI * 2;
      const yawUnitVec = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
      const tipBend = Math.random() * Math.PI * 2;
      const tipBendUnitVec = new THREE.Vector3(Math.sin(tipBend), 0, -Math.cos(tipBend));

      const bl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((BLADE_WIDTH / 2) * 1));
      const br = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((BLADE_WIDTH / 2) * -1));
      const tl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * 1));
      const tr = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(yawUnitVec).multiplyScalar((MID_WIDTH / 2) * -1));
      const tc = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(tipBendUnitVec).multiplyScalar(TIP_OFFSET));

      tl.y += height / 2;
      tr.y += height / 2;
      tc.y += height;

      const black = [0, 0, 0];
      const gray = [0.5, 0.5, 0.5];
      const white = [1.0, 1.0, 1.0];

      const verts = [
        { pos: bl.toArray(), uv: uv, color: black },
        { pos: br.toArray(), uv: uv, color: black },
        { pos: tr.toArray(), uv: uv, color: gray },
        { pos: tl.toArray(), uv: uv, color: gray },
        { pos: tc.toArray(), uv: uv, color: white }
      ];

      const indices = [
        vArrOffset,
        vArrOffset + 1,
        vArrOffset + 2,
        vArrOffset + 2,
        vArrOffset + 4,
        vArrOffset + 3,
        vArrOffset + 3,
        vArrOffset,
        vArrOffset + 2
      ];

      return { verts, indices };
    }

    function generateField() {
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const colors: number[] = [];

      for (let i = 0; i < BLADE_COUNT; i++) {
        const VERTEX_COUNT = 5;
        const surfaceMin = PLANE_SIZE / 2 * -1;
        const surfaceMax = PLANE_SIZE / 2;
        const radius = PLANE_SIZE / 2;

        const r = radius * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        const pos = new THREE.Vector3(x, 0, y);

        const uv = [convertRange(pos.x, surfaceMin, surfaceMax, 0, 1), convertRange(pos.z, surfaceMin, surfaceMax, 0, 1)];

        const blade = generateBlade(pos, i * VERTEX_COUNT, uv);
        blade.verts.forEach(vert => {
          positions.push(...vert.pos);
          uvs.push(...vert.uv);
          colors.push(...vert.color);
        });
        blade.indices.forEach(indice => indices.push(indice));
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
      geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();

      const mesh = new THREE.Mesh(geom, grassMaterial);
      scene.add(mesh);

      return { mesh, geom };
    }

    const { mesh, geom } = generateField();

    // Animation
    const clock = new THREE.Clock();
    let rafId = 0;
    const animate = () => {
      uniforms.iTime.value = clock.getElapsedTime() * 1000;
      controls.update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      controls.dispose();
      grassMaterial.dispose();
      geom.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </main>
  );
}