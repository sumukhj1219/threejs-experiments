uniform sampler2D texture1;
uniform sampler2D textures[4];

varying vec2 vUv;
varying vec2 cloudUV;
varying vec3 vColor;

void main() {
  float contrast = 1.25;
  float brightness = 0.1;
  vec3 greenGrass = texture2D(textures[0], vUv).rgb * contrast;
  greenGrass = greenGrass + vec3(brightness, brightness, brightness);
  greenGrass = mix(greenGrass, texture2D(textures[1], cloudUV).rgb, 0.4);

  vec3 finalColor = greenGrass;

  gl_FragColor.rgb = finalColor;
  gl_FragColor.a = 1.0;
}