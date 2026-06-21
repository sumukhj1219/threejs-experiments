"use client"
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import terrainVertexShader from "@/shaders/world/vertex.glsl"
import terrainFragmentShader from "@/shaders/world/fragment.glsl"

import cloudVertexShader from "@/shaders/clouds/vertex.glsl"
import cloudFragmentShader from "@/shaders/clouds/fragment.glsl"
import * as dat from 'dat.gui';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import { DRACOLoader } from 'three/examples/jsm/Addons.js';
const World: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // @ts-ignore
        THREE.ShaderChunk["simplex2d"] = `
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ; m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }
    `;

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#164a5c")
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(5, 5, 5);

        // 2. Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight("brown", "#9ebdf0", 5)
        hemisphereLight.position.set(0, 5, 0)
        scene.add(hemisphereLight)

        // Texture Loader
        const textureLoader = new THREE.TextureLoader()

        // GLB loader
        const bakedTexture = textureLoader.load("/textures/baked-world.jpg");

        bakedTexture.flipY = false;
        bakedTexture.colorSpace = THREE.SRGBColorSpace;

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        gltfLoader.load("/models/world.glb", (gltf) => {
            gltf.scene.traverse((node: any) => {
                if (node.isMesh as THREE.Mesh && node.name.includes("Light")) {
                    node.material = new THREE.MeshBasicMaterial({ 
                        color:"white",
                     });
                     return
                }
                if (node.isMesh as THREE.Mesh && node.name.includes("Curve")) {
                    node.material = new THREE.MeshBasicMaterial({ 
                        color:"#2a2a2b",
                     });
                     return
                }
                node.material = new THREE.MeshBasicMaterial({ map: bakedTexture });
            });
            scene.add(gltf.scene);
        });


        const colorParams = {
            waterDeep: "#280a07",
            waterSurface: "#933d22",
            sand: "#c69d91",
            grass: "#b3532b",
            rock: "#5a5a5a",
            snow: "#ffffff"
        };

        /**
         * Terrain
         */
        const terrainUniforms = {
            uTime: new THREE.Uniform(0),
            uPerlin: { value: textureLoader.load("/noise/perlin.png") },
            uPositionFrequency: { value: 0.2 },
            uStrength: { value: 3.0 },
            uWarpFrequency: { value: 5.0 },
            uWarpStrength: { value: 0.5 },
            uColorWaterDeep: { value: new THREE.Color(colorParams.waterDeep) },
            uColorWaterSurface: { value: new THREE.Color(colorParams.waterSurface) },
            uColorSand: { value: new THREE.Color(colorParams.sand) },
            uColorGrass: { value: new THREE.Color(colorParams.grass) },
            uColorRock: { value: new THREE.Color(colorParams.rock) },
            uColorSnow: { value: new THREE.Color(colorParams.snow) },
        }

        const geometry = new THREE.PlaneGeometry(10, 10, 500, 500)
        geometry.rotateX(-Math.PI / 2)
        const material = new CustomShaderMaterial({
            baseMaterial: THREE.MeshStandardMaterial,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            uniforms: terrainUniforms,
            silent: true,
            metalness: 0,
            roughness: 0.95,
            color: "#7e3d21"
        })
        const depthMaterial = new CustomShaderMaterial({
            baseMaterial: THREE.MeshDepthMaterial,
            vertexShader: terrainVertexShader,
            uniforms: terrainUniforms,
            silent: true,
            depthPacking: THREE.RGBADepthPacking
        })
        const terrain = new THREE.Mesh(geometry, material)
        terrain.customDepthMaterial = depthMaterial
        terrain.castShadow = true
        terrain.receiveShadow = true
        terrain.position.y = 4.75
        terrain.scale.setScalar(2.2)
        scene.add(terrain)

        /**
         * Clouds
         */
        const cloudUniforms = {
            uTime: new THREE.Uniform(0),
            uFractal: { value: textureLoader.load("/noise/fractal.jpg") },
            uCloudFrequency: { value: 0.5 }
        }

        const cloudGeometry = new THREE.PlaneGeometry(10, 10, 500, 500)
        cloudGeometry.rotateX(-Math.PI / 2)
        const cloudMaterial = new CustomShaderMaterial({
            baseMaterial: THREE.MeshStandardMaterial,
            vertexShader: cloudVertexShader,
            fragmentShader: cloudFragmentShader,
            silent: true,
            metalness: 0,
            opacity: 1.0,
            roughness: 1,
            color: "white",
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: cloudUniforms
        })
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
        cloud.castShadow = true
        cloud.receiveShadow = true
        cloud.scale.setScalar(2.2)
        cloud.position.set(0, 7.75, 0)
        scene.add(cloud)

        /**
         * Fog
         */
        scene.fog = new THREE.Fog("#164a5c", 10, 100)

        /**
         * DAT GUI
         */
        const gui = new dat.GUI({ width: 340 });

        const terrainFolder = gui.addFolder('⛰️ Terrain Shape');
        terrainFolder.add(terrainUniforms.uPositionFrequency, 'value', 0.01, 1, 0.01).name('Frequency');
        terrainFolder.add(terrainUniforms.uStrength, 'value', 0, 10, 0.1).name('Height Strength');
        terrainFolder.add(terrainUniforms.uWarpFrequency, 'value', 0, 10, 0.1).name('Warp Freq');
        terrainFolder.add(terrainUniforms.uWarpStrength, 'value', 0, 2, 0.01).name('Warp Strength');
        terrainFolder.open();

        const colorFolder = gui.addFolder('🎨 Terrain Colors');


        colorFolder.addColor(colorParams, 'waterDeep').name('Deep Water').onChange((val) => {
            terrainUniforms.uColorWaterDeep.value.set(val);
        });
        colorFolder.addColor(colorParams, 'waterSurface').name('Water Surface').onChange((val) => {
            terrainUniforms.uColorWaterSurface.value.set(val);
        });
        colorFolder.addColor(colorParams, 'sand').name('Sand').onChange((val) => {
            terrainUniforms.uColorSand.value.set(val);
        });
        colorFolder.addColor(colorParams, 'grass').name('Grass').onChange((val) => {
            terrainUniforms.uColorGrass.value.set(val);
        });
        colorFolder.addColor(colorParams, 'rock').name('Rock').onChange((val) => {
            terrainUniforms.uColorRock.value.set(val);
        });
        colorFolder.addColor(colorParams, 'snow').name('Snow').onChange((val) => {
            terrainUniforms.uColorSnow.value.set(val);
        });

        const cloudFolder = gui.addFolder('☁️ Clouds');
        cloudFolder.add(cloudUniforms.uCloudFrequency, 'value', 0.01, 2, 0.01).name('Cloud Density');

        // 5. Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // 6. Animation Loop
        let animationFrameId: number;
        const clock = new THREE.Clock()

        const animate = () => {
            const elapsedTime = clock.getElapsedTime()
            terrainUniforms.uTime.value = elapsedTime
            cloudUniforms.uTime.value = elapsedTime

            animationFrameId = requestAnimationFrame(animate);

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // 7. Handle Window Resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);

        // 8. Cleanup (Crucial in React!)
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }

            // Dispose of textures/geometries to prevent memory leaks
            gui.destroy();
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default World;