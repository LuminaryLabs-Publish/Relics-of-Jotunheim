import test from 'node:test';
import assert from 'node:assert/strict';
import {lookTarget,lookWeight,createHeadLook} from '../src/animation/head-look.js';
import {step,createState} from '../experiments/roj-0003/movement.js';
const near=(a,b,e=.001)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
class Q{
 constructor(x=0,y=0,z=0,w=1){Object.assign(this,{x,y,z,w});}
 clone(){return new Q(this.x,this.y,this.z,this.w)}
 copy(q){Object.assign(this,{x:q.x,y:q.y,z:q.z,w:q.w});return this;}
 setFromAxisAngle(a,v){const s=Math.sin(v/2);return this.copy(new Q(a.x*s,a.y*s,a.z*s,Math.cos(v/2)));}
 multiply(q){const a=this;const [x,y,z,w]=[a.x,a.y,a.z,a.w];return this.copy(new Q(w*q.x+x*q.w+y*q.z-z*q.y,w*q.y-x*q.z+y*q.w+z*q.x,w*q.z+x*q.y-y*q.x+z*q.w,w*q.w-x*q.x-y*q.y-z*q.z));}
}
const rig=()=>{const nodes=['chest','neck','head'].map(name=>({name,isBone:true,quaternion:new Q()}));return {nodes,traverse(fn){nodes.forEach(fn)}}};
test('camera-relative head yaw has correct left/right sign',()=>{near(lookTarget(Math.PI/4,0,0).yaw,-Math.PI/4);near(lookTarget(-Math.PI/4,0,0).yaw,Math.PI/4)});
test('body yaw is independent from camera yaw',()=>{const s=createState();for(let i=0;i<100;i++)step(s,{cameraYaw:1.2},1/60);near(s.heading,0)});
test('head yaw and pitch are anatomically clamped',()=>{const a=lookTarget(Math.PI,2,0);near(Math.abs(a.yaw),Math.PI/3);near(a.pitch,-Math.PI/6)});
test('combat attenuates head tracking',()=>{assert.equal(lookWeight('dodge',true),0);assert.equal(lookWeight('light_attack',true),0);assert.equal(lookWeight('idle',false),0);assert.ok(lookWeight('run',true)<1)});
test('missing head/neck disables tracking gracefully',()=>{assert.equal(createHeadLook({traverse(fn){fn({isBone:true,name:'head',quaternion:new Q()})}}),null)});
test('tracking changes head/neck/chest, then restores animation pose without drift',()=>{
 const r=rig(),controller=createHeadLook(r);assert.ok(controller);
 for(let i=0;i<120;i++){controller.beforeAnimation();controller.afterAnimation({cameraYaw:.8,cameraPitch:.3,bodyHeading:0,action:'idle',locked:true,dt:1/60});}
 const first=r.nodes.map(n=>n.quaternion.clone());
 for(let i=0;i<120;i++){controller.beforeAnimation();controller.afterAnimation({cameraYaw:.8,cameraPitch:.3,bodyHeading:0,action:'idle',locked:true,dt:1/60});}
 for(let i=0;i<3;i++)near(r.nodes[i].quaternion.y,first[i].y,.0001);
 for(let i=0;i<150;i++){controller.beforeAnimation();controller.afterAnimation({cameraYaw:0,cameraPitch:0,bodyHeading:0,action:'idle',locked:false,dt:1/60});}
 controller.reset();for(const n of r.nodes)near(n.quaternion.w,1);
});
test('animation pose is preserved as the additive base',()=>{
 const r=rig(),controller=createHeadLook(r);controller.afterAnimation({cameraYaw:.8,cameraPitch:0,bodyHeading:0,action:'idle',locked:true,dt:1/60});
 controller.beforeAnimation();const chest=r.nodes[0];chest.quaternion.setFromAxisAngle({x:1,y:0,z:0},.5);
 controller.afterAnimation({cameraYaw:.8,cameraPitch:0,bodyHeading:0,action:'idle',locked:true,dt:1/60});
 controller.beforeAnimation();near(chest.quaternion.x,Math.sin(.25));near(chest.quaternion.w,Math.cos(.25));
});
test('tracking converges at 30/60/120 fps',()=>{
 const samples=[30,60,120].map(hz=>{const r=rig(),c=createHeadLook(r);for(let i=0;i<hz*2;i++){c.beforeAnimation();c.afterAnimation({cameraYaw:.5,cameraPitch:.2,bodyHeading:0,action:'idle',locked:true,dt:1/hz});}return c.getState()});
 for(const a of samples)near(a.yaw,samples[0].yaw,1e-6);
});
