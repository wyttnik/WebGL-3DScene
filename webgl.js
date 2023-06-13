import * as glm from "gl-matrix";
import carVS from "./shaders/carVS";
import carFS from "./shaders/carFS";
import image_list from "./images/*";
import { OBJ } from "webgl-obj-loader";
import car from './models/Car';
import lamp from './models/StreetLamp2';
import trash from './models/Trash';
import bench from './models/bench';

/** @type {WebGLRenderingContext} */
let gl;

let ambientCoeff = 1.0, c1 = 0.0001, c2 = 0;
let model,lightModel,nMatrix, indices, brickTexture,emptyTexture,trashTexture,
lightOuterValue = 1.0, lightCarLeftValue = 1.0, lightCarRightValue = 1.0, lightStreet1Value = 1.0, 
lightStreet2Value = 1.0;
let meshes = {};
const app = {};
let proj_m;
let collisions = {};
collisions.lamps =[[-8,0,-10], [8,0,-30]];
collisions.trash = [8,0,0];
collisions.bench = [-8,0,-30];
let boundaries = [];

main();

function main() {
  gl = document.getElementById("test").getContext("webgl2");

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  setupWebGL();

  app.carShaderProgram = initShaderProgram(carVS, carFS);
  
  setupTextures();

  meshes.car = new OBJ.Mesh(car);
  meshes.car.offsetX = 0.0;
  meshes.car.offsetZ = 0.0;
  meshes.car.angle = 0.0;
  meshes.car.oldOffsetX = 0.0;
  meshes.car.oldOffsetZ = 0.0;
  meshes.car.oldAngle = 0.0;
  OBJ.initMeshBuffers(gl, meshes.car);
  meshes.lamp = new OBJ.Mesh(lamp);
  for (let i=0; i<meshes.lamp.vertices.length; ++i) {
    meshes.lamp.vertices[i] /= 1;
  }
  OBJ.initMeshBuffers(gl, meshes.lamp);
  meshes.trash = new OBJ.Mesh(trash);
  for (let i=0; i<meshes.trash.vertices.length; ++i) {
    meshes.trash.vertices[i] /= 2;
  }
  OBJ.initMeshBuffers(gl, meshes.trash);
  meshes.bench = new OBJ.Mesh(bench);
  for (let i=0; i<meshes.bench.vertices.length; ++i) {
    meshes.bench.vertices[i] /= 60;
  }
  OBJ.initMeshBuffers(gl, meshes.bench);
  initBoundaries();

  initListeners();

  console.log(app);
  console.log(meshes);
  let min = 100;
  let max = -100;
  let i = 2;
  while (i < meshes.bench.vertices.length){
    if (meshes.bench.vertices[i] > max) max = meshes.bench.vertices[i];
    if (meshes.bench.vertices[i] < min) min = meshes.bench.vertices[i];
    i += 3;
  }
  console.log(min, max);

  proj_m = initProjMatrix();

  requestAnimationFrame(render);
}

function initBoundaries() {
  boundaries[0] = [
    [-0.7,0,-0.7,1],
    [-0.7,0,0.76,1],
    [0.66, 0, -0.7,1],
    [0.66,0,0.76,1]
  ];
  let boundModel = glm.mat4.create();
  let boundOffset = [8,0,0], boundAngle =  0 * Math.PI/180;
  glm.mat4.translate(boundModel,boundModel,[0,-9,-80]);
  glm.mat4.rotate(boundModel,boundModel,10 * Math.PI/180,[1,0,0]);
  glm.mat4.translate(boundModel,boundModel,[boundOffset[0], 0, boundOffset[2]]);
  glm.mat4.rotate(boundModel,boundModel,boundAngle,[0,1,0]);
  for (let i = 0; i < boundaries[0].length; ++i) {
    glm.vec4.transformMat4(boundaries[0][i],boundaries[0][i],boundModel);
  }
  console.log(boundaries[0]);

  boundaries[1] = [
    [-0.41,0,-2,1],
    [-0.41,0,0.21, 1],
    [0, 0, -2,  1],
    [0 ,0, 0.21,   1]
  ];
  boundModel = glm.mat4.create();
  boundOffset = [-8,0,-10], boundAngle =  0*Math.PI/180;
  glm.mat4.translate(boundModel,boundModel,[0,-9,-80]);
  glm.mat4.rotate(boundModel,boundModel,10 * Math.PI/180,[1,0,0]);
  glm.mat4.translate(boundModel,boundModel,[boundOffset[0], 0, boundOffset[2]]);
  glm.mat4.rotate(boundModel,boundModel,boundAngle,[0,1,0]);
  for (let i = 0; i < boundaries[1].length; ++i) {
    glm.vec4.transformMat4(boundaries[1][i],boundaries[1][i],boundModel);
  }

  boundaries[2] = [
    [-0.41,0,-2,1],
    [-0.41,0,0.21, 1],
    [0, 0, -2,  1],
    [0 ,0, 0.21,   1]
  ];
  boundModel = glm.mat4.create();
  boundOffset = [8,0,-30], boundAngle =  180*Math.PI/180;
  glm.mat4.translate(boundModel,boundModel,[0,-9,-80]);
  glm.mat4.rotate(boundModel,boundModel,10 * Math.PI/180,[1,0,0]);
  glm.mat4.translate(boundModel,boundModel,[boundOffset[0], 0, boundOffset[2]]);
  glm.mat4.rotate(boundModel,boundModel,boundAngle,[0,1,0]);
  for (let i = 0; i < boundaries[2].length; ++i) {
    glm.vec4.transformMat4(boundaries[2][i],boundaries[2][i],boundModel);
  }

  boundaries[3] = [
    [-1.5,0,-0.73,1],
    [-1.5,0,0.6,1],
    [1.5, 0, -0.73,1],
    [1.5,0,0.6,1]
  ];
  boundModel = glm.mat4.create();
  boundOffset = [-8,0,-30], boundAngle =  90*Math.PI/180;
  glm.mat4.translate(boundModel,boundModel,[0,-9,-80]);
  glm.mat4.rotate(boundModel,boundModel,10 * Math.PI/180,[1,0,0]);
  glm.mat4.translate(boundModel,boundModel,[boundOffset[0], 0, boundOffset[2]]);
  glm.mat4.rotate(boundModel,boundModel,boundAngle,[0,1,0]);
  for (let i = 0; i < boundaries[3].length; ++i) {
    glm.vec4.transformMat4(boundaries[3][i],boundaries[3][i],boundModel);
  }
}

function initCommonUniforms(shaderProgram) {
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler0"), 0);
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_proj"),false,proj_m);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uc1"), c1);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uc2"), c2);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uAmbientCoeff"), ambientCoeff);

  // lights
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uLightPosition"),[5,8,-80]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uAmbientLightColor"),[0.1,0.1,0.1]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uDiffuseLightColor"),[0.7,0.7,0.7]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uSpecularLightColor"),[1.0,1.0,1.0]);
  let lampLightDir4 = [0,-1,0,1];
  let lampLightModel = glm.mat4.create();
  glm.mat4.rotate(lampLightModel,lampLightModel,10 * Math.PI/180,[1,0,0]);
  glm.vec4.transformMat4(lampLightDir4,lampLightDir4,lampLightModel);
  let lampLightDir = glm.vec3.fromValues(lampLightDir4[0],lampLightDir4[1],lampLightDir4[2]);
  glm.vec3.normalize(lampLightDir,lampLightDir);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uLampLightDir"),lampLightDir);

  // lights config
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"ulightOuterValue"), lightOuterValue);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"ulightCarLeftValue"), lightCarLeftValue);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"ulightCarRightValue"), lightCarRightValue);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"ulightStreet1Value"), lightStreet1Value);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"ulightStreet2Value"), lightStreet2Value);
}

function initLampBuffers(shaderProgram, offset, offsetAngle, lightLoc) {
  shaderProgram.vertexPosAttr = gl.getAttribLocation(shaderProgram, "a_pos");
  gl.enableVertexAttribArray(shaderProgram.vertexPosAttr);
  
  shaderProgram.vertexNormAttr = gl.getAttribLocation(shaderProgram, "a_norm");
  gl.enableVertexAttribArray(shaderProgram.vertexNormAttr);
  
  shaderProgram.textCoordAttr = gl.getAttribLocation(shaderProgram, "a_text");
  gl.enableVertexAttribArray(shaderProgram.textCoordAttr);

  
  if(!meshes.lamp.textures.length){
    gl.disableVertexAttribArray(shaderProgram.textCoordAttr);
  }
  else{
    // if the texture vertexAttribArray has been previously
    // disabled, then it needs to be re-enabled
    gl.enableVertexAttribArray(shaderProgram.textCoordAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.lamp.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textCoordAttr, 
      meshes.lamp.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes.lamp.indexBuffer);

  // vartex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.lamp.vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPosAttr, 
    meshes.lamp.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  // normals positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.lamp.normalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormAttr, 
    meshes.lamp.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // model
  model = glm.mat4.create();
  glm.mat4.translate(model,model,[0,-9,-80]);
  glm.mat4.rotate(model,model,10 * Math.PI/180,[1,0,0]);

  glm.mat4.translate(model,model,[offset[0], 0, offset[2]]);
  glm.mat4.rotate(model,model,offsetAngle,[0,1,0]);
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_model"),false,model)
  initNormMatrix(model);
  gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram,"uNMatrix"),false,nMatrix)

  // lights
  let temp = [0,0,0,1];
  let lampLightModel = glm.mat4.create();
  glm.mat4.translate(lampLightModel,lampLightModel,[0,5,-80]);
  glm.mat4.rotate(lampLightModel,lampLightModel,10 * Math.PI/180,[1,0,0]);

  glm.mat4.translate(lampLightModel,lampLightModel,[offset[0], 0, offset[2]]);
  glm.mat4.rotate(lampLightModel,lampLightModel,offsetAngle,[0,1,0]);
  glm.mat4.translate(lampLightModel,lampLightModel,[3,0,0]);
  glm.vec4.transformMat4(temp,temp,lampLightModel);
  let lampLightPos = [temp[0],temp[1],temp[2]];
  gl.uniform3fv(gl.getUniformLocation(shaderProgram, lightLoc),lampLightPos);

  gl.uniform1i(gl.getUniformLocation(shaderProgram,"u_emptyTexture"),1);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.2,0.2,0.2]);
}

function initObjBuffers(shaderProgram, meshObj, offset, offsetAngle) {
  shaderProgram.vertexPosAttr = gl.getAttribLocation(shaderProgram, "a_pos");
  gl.enableVertexAttribArray(shaderProgram.vertexPosAttr);
  
  shaderProgram.vertexNormAttr = gl.getAttribLocation(shaderProgram, "a_norm");
  gl.enableVertexAttribArray(shaderProgram.vertexNormAttr);
  
  shaderProgram.textCoordAttr = gl.getAttribLocation(shaderProgram, "a_text");
  gl.enableVertexAttribArray(shaderProgram.textCoordAttr);

  
  if(!meshObj.textures.length){
    gl.disableVertexAttribArray(shaderProgram.textCoordAttr);
  }
  else{
    // if the texture vertexAttribArray has been previously
    // disabled, then it needs to be re-enabled
    gl.enableVertexAttribArray(shaderProgram.textCoordAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshObj.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textCoordAttr, 
      meshObj.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshObj.indexBuffer);

  // vartex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshObj.vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPosAttr, 
    meshObj.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  // normals positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshObj.normalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormAttr, 
    meshObj.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // model
  model = glm.mat4.create();
  glm.mat4.translate(model,model,[0,-9,-80]);
  glm.mat4.rotate(model,model,10 * Math.PI/180,[1,0,0]);

  glm.mat4.translate(model,model,[offset[0], 0, offset[2]]);
  glm.mat4.rotate(model,model,offsetAngle,[0,1,0]);
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_model"),false,model)
  initNormMatrix(model);
  gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram,"uNMatrix"),false,nMatrix)

  gl.uniform1i(gl.getUniformLocation(shaderProgram,"u_emptyTexture"),0);
  //gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[0.2,0.2,0.2]);
}

function initCarBuffers(shaderProgram, offset, offsetAngle, leftLightLoc, rightLightLoc) {
  
  shaderProgram.vertexPosAttr = gl.getAttribLocation(shaderProgram, "a_pos");
  gl.enableVertexAttribArray(shaderProgram.vertexPosAttr);
  
  shaderProgram.vertexNormAttr = gl.getAttribLocation(shaderProgram, "a_norm");
  gl.enableVertexAttribArray(shaderProgram.vertexNormAttr);
  
  shaderProgram.textCoordAttr = gl.getAttribLocation(shaderProgram, "a_text");
  gl.enableVertexAttribArray(shaderProgram.textCoordAttr);

  
  if(!meshes.car.textures.length){
    gl.disableVertexAttribArray(shaderProgram.textCoordAttr);
  }
  else{
    // if the texture vertexAttribArray has been previously
    // disabled, then it needs to be re-enabled
    gl.enableVertexAttribArray(shaderProgram.textCoordAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.car.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textCoordAttr, 
      meshes.car.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes.car.indexBuffer);

  // vartex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.car.vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPosAttr, 
    meshes.car.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  // normals positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshes.car.normalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormAttr, 
    meshes.car.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // model
  model = glm.mat4.create();
  glm.mat4.translate(model,model,[0,-9,-80]);
  glm.mat4.rotate(model,model,10 * Math.PI/180,[1,0,0]);
  
  // car pos
  glm.mat4.translate(model,model,offset);
  glm.mat4.rotate(model,model,offsetAngle,[0,1,0]);
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_model"),false,model);
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_modelLight"),false,model);

  // lights
  let leftCarLightDir = [0.0,0.0,1.0,1];
  
  lightModel = glm.mat4.create();
  glm.mat4.rotate(lightModel,lightModel,10 * Math.PI/180,[1,0,0]);
  glm.mat4.rotate(lightModel,lightModel,meshes.car.angle,[0,1,0]);
  glm.vec4.transformMat4(leftCarLightDir,leftCarLightDir,lightModel);

  let leftCarLightDirXYZ = [leftCarLightDir[0],leftCarLightDir[1],leftCarLightDir[2]];
  glm.vec3.normalize(leftCarLightDirXYZ,leftCarLightDirXYZ);

  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uCarLightDir"),leftCarLightDirXYZ);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram, leftLightLoc),[-1.0,1.0,2.2]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram, rightLightLoc),[1.0,1.0,2.2]);

  initNormMatrix(model);
  gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram,"uNMatrix"),false,nMatrix);

  gl.uniform1i(gl.getUniformLocation(shaderProgram,"u_emptyTexture"),1);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[204/255,128/255,92/255]);
}

function initShaderProgram(vsSource, fsSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)
  
    // Create the shader program
    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
  
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram)}`)
      return null
    }
    return shaderProgram;
    //gl.useProgram(shaderProgram)
}
  
// creates a shader of the given type, uploads the source and compiles it.
function loadShader(type, source) {
    const shader = gl.createShader(type)

    // Send the source to the shader object
    gl.shaderSource(shader, source)

    // Compile the shader program
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
        gl.deleteShader(shader)
        return null
    }

    return shader
}

function setupTextures(){
  brickTexture = gl.createTexture();
  emptyTexture = gl.createTexture();
  trashTexture = gl.createTexture();
  setTexture([image_list['road.jpg'],"", image_list['trash.jpg']], 
              [brickTexture,emptyTexture, trashTexture]);
}

function setupWebGL() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(gl.DEPTH_TEST)
  //gl.enable(gl.BLEND)
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
}

function setTexture(urls, textures) {
  for(let i = 0; i < urls.length; i++){
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([3*255/4, 3*255/4, 3*255/4, 255]));

    if (urls[i].length != 0) {
      let image = new Image();
      image.onload = function() {
        handleTextureLoaded(image, textures[i]);
      }
      // image.crossOrigin = "anonymous";
      image.src = urls[i];
    }
  }
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set
    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function changeCarPos(angle, x, z) {
  let carBoundaries = [
    [-1.1,0,-2.3,1],
    [-1.1,0,2.4,1],
    [1.1,0,-2.3,1],
    [1.1,0,2.4,1]
  ];
  meshes.car.angle += angle;
  meshes.car.offsetX += x * Math.sin(meshes.car.angle);
  meshes.car.offsetZ += z * Math.cos(meshes.car.angle);
  let moveModel = glm.mat4.create();
  glm.mat4.translate(moveModel,moveModel,[0,-9,-80]);
  glm.mat4.rotate(moveModel,moveModel,10 * Math.PI/180,[1,0,0]);
  
  // car pos
  glm.mat4.translate(moveModel,moveModel,[meshes.car.offsetX,0,meshes.car.offsetZ]);
  glm.mat4.rotate(moveModel,moveModel,meshes.car.angle,[0,1,0]);
  for (let i = 0; i < carBoundaries.length; ++i){
    glm.vec4.transformMat4(carBoundaries[i],carBoundaries[i],moveModel);
  }

  if (collisionCheck(carBoundaries)){
    meshes.car.offsetX = meshes.car.oldOffsetX;
    meshes.car.offsetZ = meshes.car.oldOffsetZ;
    meshes.car.angle = meshes.car.oldAngle;
  }
  else {
    meshes.car.oldOffsetX = meshes.car.offsetX;
    meshes.car.oldOffsetZ = meshes.car.offsetZ;
    meshes.car.oldAngle = meshes.car.angle;
  }
}

function isLeft(p0,p1,p2){
  return ((p1[0]-p0[0])*(p2[1]-p0[1])-(p2[0]-p0[0])*(p1[1]-p0[1]));
}

function inRect(x,y,z,w,p){
  return (isLeft(x,y,p) < 0 && isLeft(y,z,p) < 0 &&
          isLeft(z,w,p) < 0 && isLeft(w,x,p) < 0 );
}

function collisionCheck(carBound){
  for(let j = 0; j < boundaries.length; ++j){
    let bounds = boundaries[j];
    for (let i = 0; i < carBound.length; ++i) {
      if(inRect([bounds[0][0],bounds[0][2]],
        [bounds[1][0],bounds[1][2]],
        [bounds[3][0],bounds[3][2]],
        [bounds[2][0],bounds[2][2]],
        [carBound[i][0], carBound[i][2]]) == true) return true;
    }
  
    for (let i = 0; i < bounds.length; ++i) {
      if(inRect([carBound[0][0],carBound[0][2]],
        [carBound[1][0],carBound[1][2]],
        [carBound[3][0],carBound[3][2]],
        [carBound[2][0],carBound[2][2]],
        [bounds[i][0], bounds[i][2]]) == true) return true;
    }
  }
  return false;
}

function initListeners(){
  console.log(collisions);
  window.addEventListener("keydown", e => {
    switch(e.key) {
      case "w": {
        changeCarPos(0,0.3,0.3);
        break;
      }
      case "s":{
        changeCarPos(0,-0.3,-0.3);
        break;
      }
      case "a": {
        changeCarPos(0.05,0.1,0.1);
        break;
      }
      case "d": {
        changeCarPos(-0.05,0.1,0.1);
        break;
      }
      case "z": {
        changeCarPos(-0.05,-0.1,-0.1);
        break;
      }
      case "c": {
        changeCarPos(0.05,-0.1,-0.1);
        break;
      }
    }
  });

  document.getElementById('myRange').oninput = () => {
    ambientCoeff = Number(document.getElementById('myRange').value) + 1.0;
  }

  document.getElementById('c1-range').oninput = () => {
    c1 = Number(document.getElementById('c1-range').value);
  }

  document.getElementById('c2-range').oninput = () => {
    c2 = Number(document.getElementById('c2-range').value);
  }
  
  document.getElementById('light-outer-range').value = 1.0;
  document.getElementById('light-outer-range').oninput = () => {
    lightOuterValue = Number(document.getElementById('light-outer-range').value);
  }

  document.getElementById('light-car-left-range').value = 1.0;
  document.getElementById('light-car-left-range').oninput = () => {
    lightCarLeftValue = Number(document.getElementById('light-car-left-range').value);
  }

  document.getElementById('light-car-right-range').value = 1.0;
  document.getElementById('light-car-right-range').oninput = () => {
    lightCarRightValue = Number(document.getElementById('light-car-right-range').value);
  }

  document.getElementById('light-street-1-range').value = 1.0;
  document.getElementById('light-street-1-range').oninput = () => {
    lightStreet1Value = Number(document.getElementById('light-street-1-range').value);
  }

  document.getElementById('light-street-2-range').value = 1.0;
  document.getElementById('light-street-2-range').oninput = () => {
    lightStreet2Value = Number(document.getElementById('light-street-2-range').value);
  }
}

function initProjMatrix() {
  const proj = glm.mat4.create();
  glm.mat4.perspective(proj,  Math.PI / 10, 
    gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 500.0);
  return proj;
  
}

function initNormMatrix(model){
  nMatrix = glm.mat3.create();
  glm.mat3.normalFromMat4(nMatrix, model);
}

function render(){
  gl.viewport(0,0,gl.canvas.width, gl.canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT)

  gl.useProgram(app.carShaderProgram);
  initCommonUniforms(app.carShaderProgram);
  
  

  // Car 
  initCarBuffers(app.carShaderProgram,[meshes.car.offsetX,0,meshes.car.offsetZ], meshes.car.angle,
    "uCarLeftLightPos", "uCarRightLightPos");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, emptyTexture);
  gl.drawElements(gl.TRIANGLES, meshes.car.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  
  // Floor
  initBuffers(app.carShaderProgram, 9, 90);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, brickTexture);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  // Lamp1
  initLampBuffers(app.carShaderProgram, [-8,0,-10], 0*Math.PI/180, "uLamp1LightPos");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, emptyTexture);
  gl.drawElements(gl.TRIANGLES, meshes.lamp.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // Lamp2
  initLampBuffers(app.carShaderProgram, [8,0,-30],180*Math.PI/180, "uLamp2LightPos");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, emptyTexture);
  gl.drawElements(gl.TRIANGLES, meshes.lamp.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // Trash
  initObjBuffers(app.carShaderProgram, meshes.trash,[8,0,0],0*Math.PI/180);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, brickTexture);
  gl.drawElements(gl.TRIANGLES, meshes.trash.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // Bench
  initObjBuffers(app.carShaderProgram, meshes.bench,[-8,0,-30],90*Math.PI/180);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, emptyTexture);
  gl.drawElements(gl.TRIANGLES, meshes.bench.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render)
}

function initBuffers(shaderProgram, x, z) {
  const posBuffer  = gl.createBuffer()
  let vertices = [
    // Front face
    -x, -1.0, x, x, -1.0, x, x, 1.0, x, -x, 1.0, x,

    // Back face
    x, -1.0, -z, -x, -1.0, -z, -x, 1.0, -z, x, 1.0, -z,

    // Top face
    -x, 1.0, x, x, 1.0, x, x, 1.0, -z, -x, 1.0, -z,

    // Bottom face
    -x, -1.0, -z, x, -1.0, -z, x, -1.0, x, -x, -1.0, x,

    // Right face
    x, -1.0, 1.0, x, -1.0, -z, x, 1.0, -z, x, 1.0, x,

    // Left face
    -x, -1.0, -z, -x, -1.0, x, -x, 1.0, x, -x, 1.0, -z,
  ];

  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  const vertPos = gl.getAttribLocation(shaderProgram,"a_pos")
  gl.enableVertexAttribArray(vertPos)
  gl.vertexAttribPointer(vertPos, 3, gl.FLOAT, false, 0, 0)

  const indexBuffer = gl.createBuffer()
  indices = [
    0,  1,  2,  2,  3,  0,  // front
    4,  5,  6,  6,  7,  4,  // back
    8,  9,  10, 10, 11, 8,  // top
    12, 13, 14, 14, 15, 12, // bottom
    16, 17, 18, 18, 19, 16, // right
    20, 21, 22, 22, 23, 20 // left
  ]

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  const normalsBuffer = gl.createBuffer()
  const vertexNormals = [
    // Front
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

    // Back
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

    // Top
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Bottom
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

    // Right
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

    // Left
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ]

  gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW)

  const normalPos = gl.getAttribLocation(shaderProgram,"a_norm")
  gl.enableVertexAttribArray(normalPos)
  gl.vertexAttribPointer(normalPos, 3, gl.FLOAT, false, 0, 0)

  const textCoordsBuffer = gl.createBuffer();
  const textureCoordinates = [];
  for (let i=0; i<6; i++) { textureCoordinates.push(0.0, 0.0,  1.0, 0.0,  1.0, 1.0,  0.0, 1.0 ); }

  gl.bindBuffer(gl.ARRAY_BUFFER, textCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  const aTextCoords = gl.getAttribLocation(shaderProgram,"a_text");
  gl.enableVertexAttribArray(aTextCoords);
  gl.vertexAttribPointer(aTextCoords, 2, gl.FLOAT, false, 0, 0);

  model = glm.mat4.create();
  glm.mat4.translate(model,model,[0,-10,-80]);
  glm.mat4.rotate(model,model,10 * Math.PI/180,[1,0,0]);
  //glm.mat4.translate(model,model,[0,-1,0]);
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_model"),false,model)
  initNormMatrix(model);
  gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram,"uNMatrix"),false,nMatrix)

  gl.uniform1i(gl.getUniformLocation(shaderProgram,"u_emptyTexture"),0);
}