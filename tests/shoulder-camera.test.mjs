import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraState,desiredCameraPosition,shoulderTarget,actorScreenOffset,resolveCameraDistance,updateCamera,orbitCamera,zoomCamera,cameraPose} from '../src/movement/third-person-camera.js';
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 test(`right shoulder projects fighter left at yaw ${yaw}`,()=>{
  const s=createCameraState({yaw});
  const target=shoulderTarget(s,s.focus),pos=desiredCameraPosition(s,s.focus);
  near(Math.hypot(target.x-s.focus.x,target.z-s.focus.z),.7);
  assert.ok(actorScreenOffset(s)<-.05,'actor must appear left of reticle');
  assert.ok(pos.y>target.y);
 });
}
for(const aspect of [16/9,4/3,9/16])for(const zoom of [3.4,6.7,9.5]){
 test(`framing remains left at aspect ${aspect}, zoom ${zoom}`,()=>{
  const s=createCameraState({distance:zoom});
  assert.ok(actorScreenOffset(s,aspect)<0);
 });
}
test('shoulder target differs from actor focus and follows yaw',()=>{
 const s=createCameraState();let p=cameraPose(s);
 near(p.target.x,.7);near(p.target.z,0);
 orbitCamera(s,Math.PI/2/s.sensitivity,0);
 p=cameraPose(s);near(p.target.x,0);near(p.target.z,-.7);
});
test('collision moves inward immediately and recovers smoothly',()=>{
 const s=createCameraState();near(resolveCameraDistance(s,2,1/60),2);
 const recovered=resolveCameraDistance(s,s.distance,1/60);
 assert.ok(recovered>2&&recovered<s.distance);
 for(let i=0;i<200;i++)resolveCameraDistance(s,s.distance,1/60);
 near(s.collisionDistance,s.distance,1e-5);
});
test('follow smoothing converges at 30/60/120 Hz',()=>{
 const positions=[30,60,120].map(hz=>{
  const s=createCameraState();
  for(let i=0;i<hz;i++)updateCamera(s,{x:3,y:0,z:-4},1/hz);
  return s.focus;
 });
 for(const p of positions)for(const axis of ['x','y','z'])near(p[axis],positions[0][axis],1e-6);
});
test('zoom and pitch do not reverse shoulder framing',()=>{
 const s=createCameraState();zoomCamera(s,9999);
 orbitCamera(s,0,10000);assert.ok(actorScreenOffset(s)<0);
 orbitCamera(s,0,-10000);assert.ok(actorScreenOffset(s)<0);
});
