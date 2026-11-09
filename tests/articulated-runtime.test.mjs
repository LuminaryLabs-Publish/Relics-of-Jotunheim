import test from 'node:test';
import assert from 'node:assert/strict';
import {createArticulatedFighter,gaitTargets,solveLeg} from '../src/animation/articulated-fighter.js';

test('articulated fighter creates a valid 22-joint skinned humanoid',()=>{
 const fighter=createArticulatedFighter();
 assert.equal(fighter.jointCount,22);
 for(const side of ['l','r'])
  for(const joint of ['thigh','shin','foot','toe','upper_arm','forearm','wrist','hand'])
   assert.ok(fighter.bones.has(side+'_'+joint));
 let skinned=0,vertices=0;
 fighter.scene.traverse(object=>{
  if(!object.isSkinnedMesh)return;
  skinned++;
  const positions=object.geometry.getAttribute('position');
  const weights=object.geometry.getAttribute('skinWeight');
  const indices=object.geometry.getAttribute('skinIndex');
  assert.equal(weights.count,positions.count);
  assert.equal(indices.count,positions.count);
  vertices+=positions.count;
  for(let i=0;i<positions.count;i++){
   const total=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);
   assert.ok(Math.abs(total-1)<1e-4,'weights not normalized');
   for(let j=0;j<4;j++)assert.ok(indices.getComponent(i,j)<fighter.jointCount);
  }
 });
 assert.ok(skinned>=5&&vertices>1000);
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
