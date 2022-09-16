precision mediump float;

attribute float aLength;
attribute float aDirectionX;
attribute float aDirectionY;

void main() {
  vec4 sourcePosition = vec4(position, 1.0);
  vec4 modelPosition = modelMatrix * sourcePosition;

  // float moveLength = aLength * 130.0;
  // modelPosition.xyz += aDirection * aLength * 10.0;
  modelPosition.x = sourcePosition.x + cos(aDirectionX) * aLength;
  modelPosition.y = sourcePosition.y + sin(aDirectionY) * aLength;
  modelPosition.z = sourcePosition.z + sin(aDirectionX) * aLength;

  vec4 viewPosition = viewMatrix * modelPosition;

  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = 10.0;
}
