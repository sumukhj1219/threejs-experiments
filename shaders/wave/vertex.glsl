uniform float uTime;
uniform sampler2D uPerlin;
uniform float uElevation;

varying vec2 vUv;

void main() {
    float noise = texture2D(uPerlin, uv).r;
    vec3 newPosition = position;

    newPosition.y += (sin(newPosition.x + uTime) + sin(newPosition.z + uTime)) * uElevation; 

    vUv = uv;
    csm_Position = newPosition;
}
