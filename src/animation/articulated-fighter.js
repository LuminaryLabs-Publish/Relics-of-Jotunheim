// ROJ anatomical revision: one welded skinned body, adult-proportion landmarks.
// Presentation only. NexusEngine retains Actor, Motion, contact and IK ownership.
import * as THREE from 'three';
import {ANATOMY,createAnatomicalSurface} from './anatomical-surface.js';
import {createAnatomicalPose} from './anatomical-pose.js';
export {solveLeg,gaitTargets} from './anatomical-pose.js';
export function createArticulatedFighter({solveIK}={}){
 const source=createAnatomicalSurface(),group=new THREE.Group(),bones=new Map(),all=[];
 group.name='ROJ_UnifiedAnatomicalFighter';
 for(const definition of source.bones){
  const bone=new THREE.Bone();bone.name=definition.name;
  bone.position.fromArray(definition.position);
  (definition.parent?bones.get(definition.parent):group).add(bone);
  bones.set(bone.name,bone);all.push(bone);
 }
 group.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(all),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(source.positions,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(source.normals,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(source.colors,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(source.skinIndices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(source.skinWeights,4));
 geometry.setIndex(source.indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.83});
 const skin=new THREE.SkinnedMesh(geometry,material);
 skin.name='ROJ_ContinuousSkin';skin.frustumCulled=false;skin.castShadow=true;skin.receiveShadow=true;
 group.add(skin);skin.bind(skeleton);
 // Only the inset eyeballs are separate. Skin, fingers, feet, scalp and clothing
 // color share one manifold surface: no overlapping collars or z-fighting seams.
 const sclera=new THREE.MeshStandardMaterial({color:0x99958e,roughness:.55});
 const iris=new THREE.MeshStandardMaterial({color:0x48392c,roughness:.6});
 for(const s of [-1,1]){
  for(const [position,scale,mat] of [
   [[s*.045,2.017,-.099],[.022,.010,.017],sclera],
   [[s*.045,2.017,-.115],[.008,.008,.004],iris],
  ]){
   const eye=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat);
   eye.position.set(position[0],position[1]-ANATOMY.headY,position[2]);
   eye.scale.fromArray(scale);bones.get('head').add(eye);
  }
 }
 const animator=createAnatomicalPose({solveIK});
 function apply(pose){
  for(const [name,value] of Object.entries(pose)){
   const bone=bones.get(name);bone.position.fromArray(value.position);
   bone.rotation.set(...value.rotation);
  }
 }
 function update(input){apply(animator.update(input));}
 function reset(){animator.reset();apply(animator.getPose());}
 return {scene:group,update,reset,bones,skeleton,jointCount:all.length,
  mesh:skin,anatomyVersion:ANATOMY.version};
}
