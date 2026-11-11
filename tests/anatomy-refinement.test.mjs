import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ANATOMY,anatomicalRig,anatomicalField,anatomicalWeights,createAnatomicalSurface} from '../src/animation/anatomical-surface.js';
import {createAnatomicalPose} from '../src/animation/anatomical-pose.js';

const surface=createAnatomicalSurface();
const actors=new Set(anatomicalRig().map(b=>b.name));
const legacy=JSON.parse(readFileSync(new URL('../assets/source/fighter/canonical-v2-source.json',import.meta.url)));
const actions=['Idle','Walk','Run','Sprint','Jump','Fall','Land','Heavy Landing','Dodge','Block','Light Attack','Crouch Idle','Crouch Walk','Strafe Left','Strafe Right','Backward Walk'];

test('v3 live anatomy has one bilateral Y-up forward -Z surface within the game budget',()=>{
 assert.equal(ANATOMY.version,3);
 assert.equal(surface.bones.length,22);
 assert.ok(surface.positions.length/3>32000&&surface.positions.length/3<45000);
 assert.ok(surface.indices.length/3>64844&&surface.indices.length/3<90000);
 for(const [x,y,z] of [[.11,1.56,-.12],[.32,1.64,.01],[.18,1.08,.12],[.056,1.99,-.095],[.40,.95,-.01],[.145,.075,-.15]])
  assert.ok(Math.abs(anatomicalField(x,y,z)-anatomicalField(-x,y,z))<1e-12,'Bilateral modeling symmetry');
 assert.ok(ANATOMY.pelvisY>ANATOMY.kneeY&&ANATOMY.kneeY>ANATOMY.ankleY);
});

test('shoulders, pectoral plane, pelvis, thumb, planted foot remain connected in the implicit model',()=>{
 // These locations capture real foreground masses and clearance, not arbitrary vertex counts.
 assert.ok(anatomicalField(.315,1.661,0)<0,'Shoulder attaches to chest');
 assert.ok(anatomicalField(.14,1.52,0)<0,'Thorax is solid');
 assert.ok(anatomicalField(.14,1.03,.16)<0,'Posterior pelvis supports thigh');
 assert.ok(anatomicalField(.362,.914,-.028)<0,'Thumb has a continuous root');
 assert.ok(anatomicalField(.145,.065,-.15)<0,'Forefoot stays solid');
 const minY=Math.min(...surface.positions.filter((_,i)=>i%3===1));
 assert.ok(minY>=0&&minY<.015,'Feet remain planted near neutral floor');
});

test('all existing sixteen authored clips still target the original compatible runtime bones',()=>{
 assert.deepEqual(new Set(legacy.animation.clips.map(c=>c.name)),new Set(actions));
 assert.equal(legacy.animation.clips.length,16);
 const old=new Set(legacy.rig.bones.map(b=>b.id));
 for(const clip of legacy.animation.clips)for(const track of clip.tracks){
  assert.ok(old.has(track.target),'Old rest transform exists');
  assert.ok(actors.has(track.target),'New rest transform exists');
 }
});

test('presentation IK actions and high-range head/arm inputs remain finite without moving world state',()=>{
 const model=createAnatomicalPose();
 const state={x:7,y:2,z:9,vx:0,vz:-3},before=structuredClone(state);
 for(const action of ['idle','walk','sprint','crouch_walk','jump','fall','dodge','block','light_attack'])
  for(let i=0;i<35;i++)model.update({dt:1/60,state,action});
 const pose=model.getPose();
 pose.l_upper_arm.rotation[2]=1.34;
 pose.l_forearm.rotation[0]=1.55;
 pose.l_wrist.rotation[1]=.80;
 pose.neck.rotation[1]=.32;
 pose.head.rotation[1]=.82;
 for(const [name,b] of Object.entries(pose)){
  assert.ok(actors.has(name));
  assert.ok([...b.position,...b.rotation].every(Number.isFinite));
 }
 assert.deepEqual(state,before,'No authoritative world-motion writes');
 model.reset();assert.equal(model.getPose().head.rotation[1],0);
});

test('toe-off rotates only a lifting trailing foot and reset restores flat feet',()=>{
 const animator=createAnatomicalPose();let max=0;
 for(let i=0;i<340;i++){
  const pose=animator.update({dt:1/60,action:'walk',state:{vx:0,vz:-2.7}});
  max=Math.max(max,pose.l_toe.rotation[0],pose.r_toe.rotation[0]);
  assert.ok(pose.l_toe.rotation[0]>=0&&pose.r_toe.rotation[0]>=0);
 }
 assert.ok(max>.04&&max<.20,'Bounded nonzero toe roll in gait');
 animator.reset();
 assert.equal(animator.getPose().l_toe.rotation[0],0);
 assert.equal(animator.getPose().r_toe.rotation[0],0);
});
