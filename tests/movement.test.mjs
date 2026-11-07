import test from 'node:test';import assert from 'node:assert/strict';
import {sampleTerrain,heightAt} from '../src/movement/terrain.js';
import {createGroundedMovement,computeFootTarget} from '../src/movement/contact-motion.js';
// These are deterministic contract stand-ins, NOT an integration test of installed NexusEngine.
const advance=(s,{delta,input},cfg)=>{
 const speed=input.sprint?5.7:3.1;
 const x=s.position.x+(input.x||0)*speed*delta;
 const z=s.position.z+(input.z||0)*speed*delta;
 return {actorId:s.actorId,sequence:s.sequence+1,position:{x,y:s.position.y,z},velocity:{x:(input.x||0)*speed,y:0,z:(input.z||0)*speed},grounded:true,facing:{x:0,y:0,z:-1}};
};
const contact=(s,{body,sample})=>({sequence:s.sequence+1,contact:{grounded:true,stability:1},correction:{position:{...body.position,y:sample.groundHeight},velocity:body.velocity}});
const respond=({locomotionFrame:f,contactResult:c})=>({...f,position:c.correction.position,velocity:c.correction.velocity,grounded:c.contact.grounded});
const start={actorId:'roj-fighter',position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},grounded:true,sequence:0};
test('flat, slope, plateau and step have known heights',()=>{assert.equal(heightAt(0,0),0);assert.equal(heightAt(4,0),0.5);assert.equal(heightAt(8,0),1);assert.equal(heightAt(-5,0),0.5)});
test('slope normal is normalized',()=>{const n=sampleTerrain(4,0).normal;assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-9);assert.ok(n.y<1)});
test('only one sequence advance per tick and grounded surface correction',()=>{const m=createGroundedMovement({advance,contact,respond,initialState:start});for(let i=0;i<100;i++)m.tick({x:1},1/60);let s=m.getState();assert.equal(s.sequence,100);assert.ok(Math.abs(s.position.y-heightAt(s.position.x,s.position.z))<1e-8)});
test('reset restores original position and clears frame',()=>{const m=createGroundedMovement({advance,contact,respond,initialState:start});m.tick({x:1},1/60);m.reset();assert.deepEqual(m.getState(),start);assert.equal(m.getFrame(),null)});
test('foot target projects to surface without exceeding reach',()=>{const hip={x:4,y:1.8,z:0},foot={x:4,y:0.8,z:0};const p=computeFootTarget(hip,foot,sampleTerrain,{maxReach:1.5});assert.ok(p.y>=0.5);assert.ok(Math.hypot(p.x-hip.x,p.y-hip.y,p.z-hip.z)<=1.500001)});
test('airborne foot weights can disable planting',()=>{const hip={x:0,y:2,z:0},foot={x:0,y:1,z:0};assert.deepEqual(computeFootTarget(hip,foot,sampleTerrain,{plantWeight:0}),foot)});
test('invalid terrain coordinates rejected',()=>assert.throws(()=>sampleTerrain(NaN,0)));
