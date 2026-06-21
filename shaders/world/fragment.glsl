// fragment.glsl
uniform vec3 uColorWaterDeep;
uniform vec3 uColorWaterSurface;
uniform vec3 uColorSand;
uniform vec3 uColorGrass;
uniform vec3 uColorSnow;
uniform vec3 uColorRock;

varying vec3 vPosition;

void main() {
    // Start with deep water
    vec3 color = uColorWaterDeep;

    // Water Surface (Transition around -0.5)
    float waterMix = smoothstep(-1.0, -0.2, vPosition.y);
    color = mix(uColorWaterDeep, uColorWaterSurface, waterMix);

    // Sand (Transition around 0.0)
    float sandMix = smoothstep(-0.2, 0.1, vPosition.y);
    color = mix(color, uColorSand, sandMix);

    // Grass (Transition from 0.1 to 1.0)
    float grassMix = smoothstep(0.1, 1.0, vPosition.y);
    color = mix(color, uColorGrass, grassMix);

    // Rock (Transition from 1.0 to 2.0)
    float rockMix = smoothstep(1.0, 2.0, vPosition.y);
    color = mix(color, uColorRock, rockMix);

    // Snow (Anything above 2.0)
    float snowMix = smoothstep(2.0, 2.8, vPosition.y);
    color = mix(color, uColorSnow, snowMix);

    csm_DiffuseColor = vec4(color, 1.0);
}