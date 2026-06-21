uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uPowerFactor;

varying float vElevation;
varying vec2 vUv;

#define ITERATIONS 10

vec3 calculateGerstner(vec3 pos, float freq, float amp, float speed, vec2 dir) {
    float phase = dot(pos.xz, dir) * freq + uTime * speed;
    
    float wave = sin(phase);
    float cosPhase = cos(phase);

    return vec3(
        dir.x * amp * cosPhase, 
        pow(wave * 0.5 + 0.5, uPowerFactor) * amp, 
        dir.y * amp * cosPhase  
    );
}

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 displacement = vec3(0.0);

    float currentFreq = uFrequency;
    float currentAmp = uAmplitude;
    float currentSpeed = 1.2;

    for(int i = 0; i < ITERATIONS; i++) {
        float angle = float(i) * 2.39996; 
        vec2 dir = vec2(cos(angle), sin(angle));

        float noiseFreq = currentFreq + (sin(float(i)) * 0.1);

        displacement += calculateGerstner(modelPosition.xyz, noiseFreq, currentAmp, currentSpeed, dir);

        currentFreq *= 2.0;
        currentAmp *= 0.45;
        currentSpeed *= 1.1;
    }

    vec3 newPosition = position;
    newPosition.xz += displacement.xz * 0.8;
    newPosition.y += displacement.y;

    vElevation = displacement.y;
    vUv = uv;
    csm_Position = newPosition;
}