import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayerActionController} from '../src/gameplay/player-action-controller.js';
const ground = { grounded:true, dodgeRemaining:0, dodgeCooldown:0, animation:'idle', vx:0, vz:0 };
const context = {motion:ground, combatResult:'active'};
const step = (p, input={}, n=1, ctx=context) => {let r;for(let i=0;i<n;i++) r=p.tick(input,1/60,ctx);return r;};
test('attack fires exactly once after windup and respects cooldown',()=>{
 const p=createPlayerActionController();
 assert.equal(step(p,{attackPressed:true}).strike,false);
 let strikes=0;for(let i=0;i<40;i++)strikes+=+step(p).strike;
 assert.equal(strikes,1);assert.ok(p.getState().stamina >= 85 && p.getState().stamina < 87);
 assert.equal(step(p,{attackPressed:true}).strike,false);
 for(let i=0;i<10;i++)strikes+=+step(p).strike;
 assert.equal(strikes,2);
});
test('buffered attack survives recovery but expires after window',()=>{
 const p=createPlayerActionController();step(p,{attackPressed:true});step(p,{},32);
 step(p,{attackPressed:true});let strikes=0;
 for(let i=0;i<22;i++)strikes+=+step(p).strike;
 assert.equal(strikes,1);
});
test('dodge spends stamina, respects physical cooldown, never repeats',()=>{
 const p=createPlayerActionController();
 assert.equal(step(p,{dodgePressed:true}).intent.dodgePressed,true);
 assert.equal(p.getState().stamina,75);
 assert.equal(step(p,{dodgePressed:false},1,{motion:{...ground,dodgeRemaining:.2},combatResult:'active'}).intent.dodgePressed,false);
 assert.equal(step(p,{dodgePressed:true},1,{motion:{...ground,dodgeCooldown:.3},combatResult:'active'}).intent.dodgePressed,false);
});
test('block and attack mutually exclusive; block drains, sprint drains and regens',()=>{
 const p=createPlayerActionController();
 assert.equal(step(p,{block:true}).blocking,true);
 assert.ok(p.getState().stamina<100);
 assert.equal(step(p,{attackPressed:true,block:true}).blocking,false);
 const st=p.getState().stamina;
 step(p,{sprint:true},10);assert.equal(p.getState().stamina,st);
 step(p,{},70);assert.ok(p.getState().stamina>st);
});
test('insufficient stamina rejects actions; death clears buffers and reset restores',()=>{
 const p=createPlayerActionController({maxStamina:10,regenRate:0});
 assert.equal(step(p,{attackPressed:true}).reason,'insufficient-stamina-attack');
 assert.equal(step(p,{dodgePressed:true}).reason,'insufficient-stamina-dodge');
 assert.equal(step(p,{attackPressed:true},1,{motion:ground,combatResult:'defeat'}).action,'dead');
 assert.equal(p.getState().attackBuffer,0);p.reset();assert.equal(p.getState().stamina,10);
});
test('jump forwards a grounded edge; camera heading stays unchanged',()=>{
 const p=createPlayerActionController();
 const res=step(p,{jumpPressed:true,cameraYaw:2.3,left:true});
 assert.equal(res.intent.jumpPressed,true);assert.equal(res.intent.cameraYaw,2.3);
 assert.equal(p.animation({...ground,grounded:false,vy:-2}), 'fall');
});
test('stun blocks buffered attack and resets interruptible phase',()=>{
 const p=createPlayerActionController();step(p,{attackPressed:true});p.stun(.2);
 const r=step(p,{attackPressed:true});assert.equal(r.strike,false);
 assert.equal(r.action,'stunned');assert.equal(p.getState().attackPhase,'none');
});
