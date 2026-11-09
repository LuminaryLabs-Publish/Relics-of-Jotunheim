import test from 'node:test';
import assert from 'node:assert/strict';
import {lookTarget,createHeadLook} from '../src/animation/head-look.js';
import {movementVector,wrapAngle,createCameraState,shoulderTarget} from '../src/movement/third-person-camera.js';
import {constrainArenaFrame,ARENA_RADIUS,sampleArenaFloor} from '../src/movement/arena-surface.js';
import {createFixedStepper} from '../src/runtime/fixed-step.js';
const near=(x,y,e=1e-7)=>assert.ok(Math.abs(x-y)<e,`${x} vs ${y}`);
for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 test(`aligned camera and actor have zero head yaw at ${yaw} radians`,()=>{
  near(wrapAngle(lookTarget(yaw,.22,yaw).yaw),0);
  const s=createCameraState({yaw});
  const target=shoulderTarget(s,s.focus);
  near(Math.hypot(target.x-s.focus.x,target.z-s.focus.z),s.shoulder);
  const f=movementVector({forward:true},yaw);
  const heading=Math.atan2(-f.x,-f.z);
  near(wrapAngle(lookTarget(yaw,0,heading).yaw),0);
 });
 test(`relative head turn matches camera-to-body change at ${yaw}`,()=>{
  const delta=.23;
  near(lookTarget(yaw+delta,0,yaw).yaw,delta);
  near(lookTarget(yaw-delta,0,yaw).yaw,-delta);
 });
}
test('arena correction stays inside disk and removes only outward velocity',()=>{
 const frame={position:{x:20,y:0,z:0},velocity:{x:8,y:0,z:3},grounded:true,metadata:{flag:true}};
 const r=constrainArenaFrame(frame);
 near(Math.hypot(r.position.x,r.position.z),ARENA_RADIUS);near(r.velocity.x,0);near(r.velocity.z,3);
 assert.equal(r.metadata.flag,true);assert.equal(r.metadata.arenaBoundaryApplied,true);
 assert.equal(frame.position.x,20,'source frame remains untouched');
});
test('live level arena never samples invisible terrain fixture',()=>{
 for(const [x,z] of [[4,0],[8,0],[-5,0],[0,0]])near(sampleArenaFloor(x,z).groundHeight,0);
});
test('fixed step advances at most six steps and drops runaway background time',()=>{
 const f=createFixedStepper(),steps=[];
 f.advance(100,dt=>steps.push(dt));
 assert.equal(steps.length,6);near(steps.reduce((a,b)=>a+b,0),.1);
 assert.equal(f.snapshot().stepsTotal,6);
 f.reset();assert.equal(f.snapshot().stepsTotal,0);
});
test('fixed step preserves short-frame input until a tick',()=>{
 const f=createFixedStepper(),results=[];
 let pendingJump=true;
 const a=f.advance(1/120,()=>{results.push(pendingJump);pendingJump=false;});
 assert.equal(a.steps,0);assert.equal(pendingJump,true);
 const b=f.advance(1/120,()=>{results.push(pendingJump);pendingJump=false;});
 assert.equal(b.steps,1);assert.deepEqual(results,[true]);
});
test('fixed simulation position matches 30/60/120Hz render frame pacing',()=>{
 const distances=[30,60,120].map(hz=>{const f=createFixedStepper();let p=0;
  for(let i=0;i<hz;i++)f.advance(1/hz,dt=>{p+=3*dt;});return p;
 });
 for(const distance of distances)near(distance,3,1e-8);
});
test('head look null fallback preserves animation and camera operation',()=>{
 const root={traverse(fn){fn({isBone:true,name:'arm'})}};
 assert.equal(createHeadLook(root),null);
});

test('relative head rotation aligns actual local -Z forward with camera',()=>{
 for(const body of [0,Math.PI/2,-Math.PI/2,Math.PI])
 for(const delta of [-.35,-.1,0,.1,.35]){
  const yaw=body+delta;
  const local=lookTarget(yaw,0,body).yaw;
  const combined=wrapAngle(body+local);
  const forward={x:-Math.sin(combined),z:-Math.cos(combined)};
  near(forward.x,-Math.sin(yaw));near(forward.z,-Math.cos(yaw));
 }
});
