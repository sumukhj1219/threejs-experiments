varying vec2 vUv;
varying float vHeight;
uniform sampler2D uFractal;

void main() {
    float noise = texture2D(uFractal, vUv).r;
    
    float alpha = smoothstep(0.2, 0.5, noise);
    
    float distanceToCenter = distance(vUv, vec2(0.5));
    float edgeMask = smoothstep(0.5, 0.2, distanceToCenter);
    alpha *= edgeMask;

    vec3 cloudTop = vec3(1.0);
    vec3 cloudBase = vec3(0.6, 0.6, 0.7);
    vec3 finalColor = mix(cloudBase, cloudTop, vHeight);
  
    csm_DiffuseColor = vec4(finalColor, alpha);
}