varying float vElevation;
varying vec2 vUv;

uniform sampler2D uWorleyNoise;
uniform sampler2D uPerlinNoise;
uniform sampler2D uSimplexNoise;
uniform sampler2D uFractalNoise;
uniform sampler2D uDiffuseNoise;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

void main() {
    vec4 lowColor = vec4(0.1, 0.25, 0.75, 1.0);
    vec4 highColor = vec4(0.1, 0.5, 1.0, 1.0);

    vec4 worleyNoise = texture2D(uWorleyNoise, vUv);
    vec4 perlinNoise = texture2D(uPerlinNoise, vUv);
    vec4 simplexNoise = texture2D(uSimplexNoise, vUv);
    vec4 fractalNoise = texture2D(uFractalNoise, vUv);
    vec4 diffuseNoise = texture2D(uDiffuseNoise, vUv);

    vec3 baseColor = mix(lowColor.rgb - vec3(0.25), highColor.rgb + vec3(0.25), vElevation);

    vec3 color1 = mix(baseColor, vec3(uColor1), worleyNoise.b);
    vec3 color2 = mix(baseColor, vec3(uColor2), perlinNoise.b);
    vec3 color3 = mix(baseColor, vec3(uColor3), fractalNoise.b);
    vec3 color4 = mix(baseColor, vec3(1.0), diffuseNoise.b);

    vec3 finalColor = mix(color2, color1, 0.25);
    finalColor = mix(finalColor, color3, vElevation);
    finalColor = mix(finalColor, color4, vElevation);

    csm_FragColor = vec4(finalColor, 1.0);
}
