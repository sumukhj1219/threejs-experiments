uniform float uTime;
uniform vec3 uColor;


varying vec3 vPosition;
varying vec3 vNormal;


void main() {
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
        normal *= -1.0;

    float stripes = mod((vPosition.y - uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 3.0);

    //Frensel
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float frensel = dot(viewDirection, normal) + 1.0;
    frensel = pow(frensel, 2.0);

    // Falloff
    float falloff = smoothstep(0.8, 0.0, frensel);

    //Holographic
    float holographic = stripes * frensel;
    holographic += frensel * 1.25;
    holographic *= falloff;


    gl_FragColor = vec4(uColor, holographic);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>


}