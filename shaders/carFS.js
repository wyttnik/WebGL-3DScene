const cube_frag = `
#ifdef GL_ES 
precision highp float;
#endif

// specific lights
uniform vec3 uLightPosition;
uniform vec3 uCarLeftLightPos;
uniform vec3 uCarRightLightPos;
uniform vec3 uLamp1LightPos;
uniform vec3 uLamp2LightPos;
uniform vec3 uCarLightDir;
uniform vec3 uLampLightDir;

// lights config
uniform float ulightOuterValue;
uniform float ulightCarLeftValue;
uniform float ulightCarRightValue;
uniform float ulightStreet1Value;
uniform float ulightStreet2Value;

// common
uniform sampler2D uSampler0;
uniform vec3 uColor;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform float uAmbientCoeff;
uniform float uc1;
uniform float uc2;

uniform mat4 u_modelLight;
uniform int u_emptyTexture;

varying vec2 v_text;
varying vec3 v_norm;
varying vec3 v_surfacePos;

vec3 lightConfig(vec3 lightPosition, int mode){
  if (mode == 1) {
    vec4 tempLight = u_modelLight * vec4(lightPosition, 1.0);
    lightPosition = tempLight.xyz;
  }
  float d = distance(lightPosition, v_surfacePos);

  vec3 dirToLight = normalize(lightPosition - v_surfacePos); // l

  vec3 normal = normalize(v_norm);
  vec3 reflVec = normalize(reflect(-dirToLight, normal)); // r

  vec3 dirToView = normalize(0.0 - v_surfacePos); // v

  float diffLightDot = max(dot(normal,dirToLight),0.0);
  float specLightDot = max(dot(reflVec,dirToView),0.0);
  float specLightParam = pow(specLightDot, 16.0);
  if (mode == 1){
    float dotFromDirection = dot(dirToLight, -uCarLightDir);
    float inLight = smoothstep(0.9, 1.0, dotFromDirection);

    return inLight * (1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * 
      (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam));
  }
  if (mode == 2) {
    float dotFromDirection = dot(dirToLight, -uLampLightDir);
    float inLight = smoothstep(0.8, 1.0, dotFromDirection);

    return inLight * (1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * 
      (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam));
  }

  return 1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * 
    (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam);
}

void main() { 
  vec3 LightWeighting =  uAmbientCoeff * uAmbientLightColor + 
    lightConfig(uLightPosition,0) * ulightOuterValue + 
    lightConfig(uCarLeftLightPos,1) * ulightCarLeftValue+
    lightConfig(uCarRightLightPos,1) * ulightCarRightValue +
    lightConfig(uLamp1LightPos,2) * ulightStreet1Value + 
    lightConfig(uLamp2LightPos,2) * ulightStreet2Value;
  
  if (u_emptyTexture == 0) {
    vec4 matTex = texture2D(uSampler0, v_text);
  
    gl_FragColor = vec4(matTex.rgb * LightWeighting,matTex.a);
  }
  else gl_FragColor = vec4(uColor.rgb * LightWeighting, 1.0);
}`;

export default cube_frag;