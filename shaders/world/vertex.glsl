#include <simplex2d>

uniform sampler2D uPerlin;
uniform sampler2D uMountainNoise;
uniform float uPositionFrequency;
uniform float uStrength;
uniform float uWarpFrequency;
uniform float uWarpStrength;
uniform float uTime;
varying vec2 vUv;
varying float vElevation;
varying vec3 vPosition;

float getElevation(vec2 position) {
    float slowTime = uTime * 0.05;
    float fastTime = uTime * 0.05;

    vec2 warpedPos = position;
    warpedPos.x += snoise(position * 0.5 + slowTime) * uWarpStrength;
    warpedPos.y += snoise(position * 0.5 + slowTime) * uWarpStrength;


    float baseShape = snoise(warpedPos * uPositionFrequency + fastTime);
    float elevation = pow(baseShape * 0.5 + 0.5, 3.0) * uStrength;


    float crackPattern = snoise(warpedPos * uPositionFrequency * 1.0 + fastTime);
    float crackStrength = pow(1.0 - abs(crackPattern), 1.50); 
    
    float rough = snoise(position * 10.5) * 0.02;

    elevation -= (crackStrength * 0.8);
    if(elevation >= 0.5)
    elevation += rough;

    vElevation = elevation;
    return elevation;
}

void main() {
    //Neighbours positions
    float shift = 0.01;
    vec3 positionA = position + vec3(shift, 0.0, 0.0);
    vec3 positionB = position + vec3(0.0, 0.0, -shift);


    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;

    positionA.y += getElevation(positionA.xz);
    positionB.y += getElevation(positionB.xz);

    //Compute Normals
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);

    vUv = uv;
    vPosition = csm_Position;
}