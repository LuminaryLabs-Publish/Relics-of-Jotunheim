import test from 'node:test';
import assert from 'node:assert/strict';
import {createArticulatedFighter,gaitTargets,solveLeg} from '../src/animation/articulated-fighter.js';
import {createAnatomicalSurface} from '../src/animation/anatomical-surface.js';

test('articulated fighter creates one valid 22-joint skinned humanoid',()=>{
 const fighter=createArticulatedFighter(),source=createAnatomicalSurface();
 assert.equal(fighter.jointCount,22);
 for(const side of ['l','r'])
  for(const joint of ['thigh','shin','foot','toe','upper_arm','forearm','wrist','hand'])
   assert.ok(fighter.bones.has(side+'_'+joint));
 let skinned=0,vertices=0;
 fighter.scene.traverse(object=>{
  if(!object.isSkinnedMesh)return;
  skinned++;
  assert.equal(object,fighter.mesh,'The exposed body must be the rendered skin');
  assert.equal(object.name,'ROJ_ContinuousSkin');
  assert.equal(object.skeleton,fighter.skeleton);
  assert.equal(object.skeleton.bones.length,fighter.jointCount);
  const positions=object.geometry.getAttribute('position');
  const weights=object.geometry.getAttribute('skinWeight');
  const indices=object.geometry.getAttribute('skinIndex');
  const normals=object.geometry.getAttribute('normal');
  const colors=object.geometry.getAttribute('color');
  assert.equal(weights.count,positions.count);
  assert.equal(indices.count,positions.count);
  assert.equal(normals.count,positions.count);
  assert.equal(colors.count,positions.count);
  assert.equal(object.geometry.getIndex().count,source.indices.length);
  assert.equal(object.material.vertexColors,true);
  vertices+=positions.count;
  for(let i=0;i<positions.count;i++){
   const total=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);
   assert.ok(Math.abs(total-1)<1e-4,'weights not normalized');
   for(let j=0;j<4;j++)assert.ok(indices.getComponent(i,j)<fighter.jointCount);
  }
 });
 // The old >=5 assertion encoded the removed disconnected-loft implementation.
 // Require the intended welded body, not duplicate meshes to satisfy a count.
 assert.equal(skinned,1,'One continuous skinned body, with separate inset eyes only');
 assert.equal(vertices,source.positions.length/3);
 assert.ok(vertices>1000&&vertices<45000,'Bounded nonempty body geometry');
});

test('two-bone gait is reachable and flexes at the knee',()=>{
 const neutral=solveLeg(.94,.11,0);
 const stride=solveLeg(.94,.20,-.25);
 assert.ok(neutral.knee<-.1&&neutral.knee>-Math.PI);
 assert.ok(stride.knee<-.1);
 assert.ok(Math.abs(neutral.hip+neutral.knee+neutral.ankle)<1e-6);
 const left=gaitTargets(Math.PI/2,3.1,'walk');
 assert.ok(left[0].y>left[1].y);
});

test('update animates opposing legs without modifying world motion',()=>{
 const fighter=createArticulatedFighter();
 fighter.update({dt:1/30,state:{vx:0,vz:-3.1},action:'walk'});
 const left=fighter.bones.get('l_thigh').rotation.x;
 const right=fighter.bones.get('r_thigh').rotation.x;
 assert.ok(Number.isFinite(left)&&Number.isFinite(right));
 for(let i=0;i<20;i++)fighter.update({dt:1/60,state:{vx:0,vz:-3.1},action:'walk'});
 assert.ok(Math.abs(fighter.bones.get('l_thigh').rotation.x-fighter.bones.get('r_thigh').rotation.x)>.01);
 fighter.reset();
 assert.equal(fighter.bones.get('l_thigh').rotation.x,0);
});
