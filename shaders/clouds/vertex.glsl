#include <simplex2d>

uniform sampler2D uFractal;
uniform float uCloudFrequency;
uniform float uTime;

varying float vHeight;
varying vec2 vUv;

void main() {
    vUv = uv;
    
    float cycleTime = mod(uTime, 100.0);

    vec2 warpCoord = position.xz * 0.5;
    warpCoord += cycleTime * 0.05; 
    
    float warp = snoise(warpCoord) * 0.001;

    vec2 movingUv = fract(vUv + (cycleTime * 0.01) + warp);
    float noise = texture2D(uFractal, movingUv).r;

    vec3 newPosition = position;
    newPosition.y += noise * uCloudFrequency;

    csm_Position = newPosition;
    vHeight = noise; 
}