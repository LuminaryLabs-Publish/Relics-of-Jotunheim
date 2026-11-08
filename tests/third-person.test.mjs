import test from 'node:test';import assert from 'node:assert/strict';
import {movementVector,wrapAngle,moveAngleToward,createCameraState,orbitCamera,zoomCamera,desiredCameraPosition,updateCamera} from '../src/movement/third-person-camera.js';
import {step,createState,config} from '../experiments/roj-0003/movement.js';
const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 for(const direction of ['forward','backward','left','right']){
  test(`${direction} movement at ${Math.round(yaw*180/Math.PI)} camera degrees`,()=>{
   const v=movementVector({[direction]:true},yaw);
   const ref={forward:[-Math.sin(yaw),-Math.cos(yaw)],backward:[Math.sin(yaw),Math.cos(yaw)],
    left:[-Math.cos(yaw),Math.sin(yaw)],right:[Math.cos(yaw),-Math.sin(yaw)]}[direction];
   close(v.x,ref[0]);close(v.z,ref[1]);close(Math.hypot(v.x,v.z),1);
  });
 }
}
test('all eight directional combinations have unit speed',()=>{
 for(const yaw of [0,.2,1.8,Math.PI])for(const keys of [{forward:true},{backward:true},{left:true},{right:true},
 {forward:true,right:true},{forward:true,left:true},{backward:true,right:true},{backward:true,left:true}]){
  const v=movementVector(keys,yaw);close(Math.hypot(v.x,v.z),1);
 }
});
test('opposite keys cancel',()=>{assert.deepEqual(movementVector({forward:true,backward:true},0),{x:0,z:0,magnitude:0});});
test('smooth turning takes shortest route around +/- pi',()=>{
 const from=Math.PI-.08,to=-Math.PI+.08;
 const next=moveAngleToward(from,to,.05);
 close(wrapAngle(next-from),.05);assert.ok(Math.abs(wrapAngle(to-next))<.16);
});
test('180 degree reverse never snaps instantly',()=>{
 const s=createState();step(s,{backward:true,cameraYaw:0},1/60);
 assert.ok(Math.abs(s.heading)>0&&Math.abs(s.heading)<Math.PI/3);
 for(let i=0;i<50;i++)step(s,{backward:true,cameraYaw:0},1/60);
 close(Math.abs(s.heading),Math.PI,1e-4);
});
test('camera drag rotates yaw and clamps pitch without flipping',()=>{
 const c=createCameraState();orbitCamera(c,200,-500);assert.ok(c.yaw!==0);close(c.pitch,c.maxPitch);
 orbitCamera(c,0,10000);close(c.pitch,c.minPitch);
 orbitCamera(c,400000,0);assert.ok(Math.abs(c.yaw)<=Math.PI);
});
test('camera zoom remains bounded',()=>{const c=createCameraState();zoomCamera(c,99999);close(c.distance,c.maxDistance);zoomCamera(c,-99999);close(c.distance,c.minDistance)});
test('orbit camera preserves fighter position',()=>{const c=createCameraState(),actor={x:2,y:0,z:-5};orbitCamera(c,120,70);updateCamera(c,actor,1/60);assert.deepEqual(actor,{x:2,y:0,z:-5});assert.ok(Number.isFinite(c.position.x))});
test('camera tracking converges with independent frame steps',()=>{
 const a=createCameraState(),b=createCameraState(),actor={x:6,y:0,z:-4};
 for(let i=0;i<30;i++)updateCamera(a,actor,1/30);
 for(let i=0;i<120;i++)updateCamera(b,actor,1/120);
 for(const axis of ['x','y','z'])close(a.focus[axis],b.focus[axis],1e-7);
});
test('camera orientation aligns with camera-relative movement',()=>{
 const c=createCameraState();orbitCamera(c,Math.PI/2/c.sensitivity,0);
 const p=desiredCameraPosition(c,{x:0,y:0,z:0});
 const f=movementVector({forward:true},c.yaw);
 assert.ok(p.x>0);assert.ok(f.x<0);close(f.z,0);
});
test('sprint and diagonal movement are speed normalized',()=>{
 const s=createState();for(let i=0;i<300;i++)step(s,{forward:true,right:true,sprint:true,cameraYaw:.3},1/120);
 close(Math.hypot(s.vx,s.vz),config.run,1e-6);
});
test('release brakes to rest',()=>{
 const s=createState();for(let i=0;i<60;i++)step(s,{forward:true},1/60);
 for(let i=0;i<60;i++)step(s,{},1/60);
 close(Math.hypot(s.vx,s.vz),0);
});
test('dodge direction is locked at invocation while camera moves',()=>{
 const s=createState();step(s,{right:true,dodgePressed:true},1/120);
 const sign=Math.sign(s.vx);for(let i=0;i<14;i++)step(s,{forward:true,cameraYaw:Math.PI},1/120);
 assert.equal(Math.sign(s.vx),sign);assert.ok(Math.abs(s.vz)<1e-6);
});
test('jump retains airborne steering and landing',()=>{
 const s=createState();step(s,{jumpPressed:true,forward:true},1/60);assert.equal(s.grounded,false);
 for(let i=0;i<100;i++)step(s,{right:true},1/60);
 assert.equal(s.grounded,true);assert.ok(s.x>0);
});
test('camera-relative distance is stable across 30/60/120Hz',()=>{
 const distances=[30,60,120].map(hz=>{const s=createState();for(let i=0;i<hz*3;i++)step(s,{forward:true,right:true,cameraYaw:.8},1/hz);return Math.hypot(s.x,s.z)});
 assert.ok(Math.max(...distances)-Math.min(...distances)<.11,JSON.stringify(distances));
});
