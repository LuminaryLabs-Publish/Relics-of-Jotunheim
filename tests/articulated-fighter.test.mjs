import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ANATOMY,anatomicalRig} from '../src/animation/anatomical-surface.js';
import {solveLeg,gaitTargets,createAnatomicalPose} from '../src/animation/anatomical-pose.js';
const source=readFileSync(new URL('../src/animation/articulated-fighter.js',import.meta.url),'utf8');

test('articulated fighter keeps knees, ankles, elbows, hands and source skinning',()=>{
 const names=new Set(anatomicalRig().map(b=>b.name));
 for(const suffix of ['thigh','shin','foot','toe','upper_arm','forearm','wrist','hand'])
  for(const side of ['l','r'])assert.ok(names.has(side+'_'+suffix));
 assert.match(source,/new THREE\.SkinnedMesh/);assert.match(source,/skinWeight/);
 assert.match(source,/createAnatomicalSurface/);assert.match(source,/createAnatomicalPose/);
});
test('idle legs are nearly extended and ankle orientation cancels the leg angles',()=>{
 const p=solveLeg(ANATOMY.hipY,ANATOMY.ankleY,0);
 assert.ok(Math.abs(p.knee)<.15);
 assert.ok(Math.abs(p.hip+p.knee+p.ankle)<1e-12);
 for(const height of [.1,.3,.6,1,3]){
  const r=solveLeg(height,ANATOMY.ankleY,.2);
  assert.ok(Object.values(r).every(Number.isFinite));
 }
});
test('gait targets keep feet above ground and alternate their phases',()=>{
 for(let phase=0;phase<7;phase+=.1){
  const t=gaitTargets(phase,4,'run');
  assert.ok(t.every(v=>v.y>=ANATOMY.ankleY));
  assert.ok(Math.abs(t[0].z+t[1].z)<1e-8);
 }
 assert.ok(gaitTargets(0,0,'idle').every(v=>v.z===0));
});
test('pose update preserves motion authority and native IK delegation',()=>{
 const calls=[];
 const p=createAnatomicalPose({solveIK:args=>{calls.push(args);return null;}});
 const state={x:1,y:0,z:2,vx:2,vz:0},before=structuredClone(state);
 p.update({state,dt:1/60,action:'walk'});
 assert.deepEqual(state,before);assert.equal(calls.length,2);
 assert.equal(calls[0].upperLength,ANATOMY.upperLeg);
 assert.equal(calls[0].lowerLength,ANATOMY.lowerLeg);
});
test('all existing action names produce finite poses and reset restores full rest transforms',()=>{
 const p=createAnatomicalPose();
 const actions=['idle','walk','run','sprint','jump','fall','land','heavy_landing','dodge','block','light_attack','crouch_idle','crouch_walk','strafe_left','strafe_right','backward_walk'];
 for(const action of actions)for(let i=0;i<50;i++){
  const pose=p.update({dt:1/60,state:{vx:3,vz:0},action});
  for(const b of Object.values(pose))assert.ok([...b.position,...b.rotation].every(Number.isFinite));
 }
 p.update({dt:.1,action:'crouch_idle'});p.reset();
 for(const b of anatomicalRig()){
  assert.deepEqual(p.getPose()[b.name].position,b.position);
  assert.deepEqual(p.getPose()[b.name].rotation,[0,0,0]);
 }
});
test('block and attack raise the arms toward the negative-Z actor front',()=>{
 const p=createAnatomicalPose();
 assert.ok(p.update({action:'block'}).r_upper_arm.rotation[0]>0);
 assert.ok(p.update({action:'light_attack'}).r_upper_arm.rotation[0]>0);
});
