import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCameraState,desiredCameraPosition,cameraPose,orbitCamera,updateCamera} from '../src/movement/third-person-camera.js';
for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 for(const aspect of [16/9,4/3,9/16]){
  test(`actual Three.js projection keeps actor left at yaw ${yaw} aspect ${aspect}`,()=>{
   const state=createCameraState({yaw});
   for(let i=0;i<80;i++)updateCamera(state,{x:0,y:0,z:0},1/60);
   const pose=cameraPose(state);
   const c=new THREE.PerspectiveCamera(60,aspect,.1,150);
   c.position.set(pose.position.x,pose.position.y,pose.position.z);
   c.lookAt(pose.target.x,pose.target.y,pose.target.z);
   c.updateMatrixWorld();
   const actor=new THREE.Vector3(0,state.focus.y,0).project(c);
   assert.ok(actor.x<-.02,`actor NDC x ${actor.x} must be left`);
  });
 }
}
