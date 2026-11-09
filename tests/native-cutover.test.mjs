import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameEngine,setFighterAsset} from '../src/engine.js';
import {createPlayerMotion} from '../src/movement/player-motion.js';
import {FIGHTER_ASSETS,REQUIRED_FIGHTER_CLIPS} from '../src/gameplay/fighter-assets.js';
import {ARENA_RADIUS} from '../src/movement/arena-surface.js';
const near=(a,b,t=.001)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('full native Actor/Motion/Contact/IK composition is installed once',()=>{
 const e=createGameEngine();
 assert.equal(e.n.player.getControlledCharacter('local-player').character.id,'roj-fighter');
 assert.equal(e.n.creature.get('roj-fighter-creature').body.descriptorId,FIGHTER_ASSETS.preferred);
 for(const [key,fn] of [['motion','commitMotionFrame'],['twoBoneIk','solveTwoBoneIK'],
   ['actionLocomotion','step'],['worldContact','resolve'],['locomotionContactResponse','correct']])
  assert.equal(typeof e.n[key]?.[fn],'function',`Missing native ${key}.${fn}`);
 assert.equal(REQUIRED_FIGHTER_CLIPS.length,16);
});
test('character fallback updates actual NexusEngine descriptor without replacing Actor',()=>{
 const e=createGameEngine();setFighterAsset(e,FIGHTER_ASSETS.fallback);
 assert.equal(e.n.creature.get('roj-fighter-creature').body.descriptorId,FIGHTER_ASSETS.fallback);
 assert.equal(e.n.player.getControlledCharacter('local-player').character.id,'roj-fighter');
 setFighterAsset(e,FIGHTER_ASSETS.experimental);
 assert.equal(e.n.creature.get('roj-fighter-creature').body.descriptorId,FIGHTER_ASSETS.experimental);
 setFighterAsset(e,FIGHTER_ASSETS.legacyFallback);
 assert.equal(e.n.creature.get('roj-fighter-creature').body.descriptorId,FIGHTER_ASSETS.legacyFallback);
 setFighterAsset(e,FIGHTER_ASSETS.preferred);
 assert.equal(e.n.creature.get('roj-fighter-creature').body.descriptorId,FIGHTER_ASSETS.preferred);
 assert.throws(()=>setFighterAsset(e,'random.glb'),RangeError);
});
test('native Motion records corrected locomotion frame, one sequence per tick',()=>{
 const e=createGameEngine(),p=createPlayerMotion(e);
 for(let i=0;i<120;i++){p.tick({forward:true,cameraYaw:0},1/60);e.tick(1/60);}
 const state=p.getState();const frame=e.n.motion.getMotionFrame();
 assert.equal(state.sequence,120);
 assert.equal(frame.frame,120);
 assert.equal(frame.requests.length,1);
 near(frame.requests[0].position.z,state.z,1e-6);
 near(frame.requests[0].linearVelocity.z,state.vz,1e-6);
 assert.ok(state.z<0);assert.equal(state.grounded,true);
});
test('A/D movement and fighter heading signs match local -Z model',()=>{
 for(const [key,side] of [['left',-1],['right',1]]){
  const p=createPlayerMotion(createGameEngine());
  for(let i=0;i<90;i++)p.tick({[key]:true,cameraYaw:0},1/120);
  const state=p.getState();
  assert.equal(Math.sign(state.x),side);
  near(-Math.sin(state.heading),side,.07);
 }
});
test('native world contact lands jump and preserves ground height',()=>{
 const e=createGameEngine(),p=createPlayerMotion(e);
 let airborne=false;
 for(let i=0;i<120;i++){
  const s=p.tick({jumpPressed:i===0,forward:true},1/60);
  if(!s.grounded)airborne=true;
 }
 const last=p.getState();assert.ok(airborne);assert.equal(last.grounded,true);
 near(last.y,0);near(last.vy,0);
 assert.equal(e.n.motion.getMotionFrame().frame,120);
});
test('native cooldown prevents repeated dodge until ready',()=>{
 const p=createPlayerMotion(createGameEngine());
 p.tick({dodgePressed:true,right:true},1/60);
 const first=p.getState();assert.ok(first.dodgeRemaining>0);assert.ok(first.dodgeCooldown>.5);
 for(let i=0;i<12;i++)p.tick({dodgePressed:true,right:true},1/60);
 assert.ok(p.getState().dodgeRemaining<first.dodgeRemaining);
 assert.ok(p.getState().dodgeCooldown<first.dodgeCooldown);
 for(let i=0;i<70;i++)p.tick({right:true},1/60);
 p.tick({dodgePressed:true,right:true},1/60);
 assert.ok(p.getState().dodgeRemaining>0);
});
test('arena bounds are enforced by contact response, not by renderer',()=>{
 const p=createPlayerMotion(createGameEngine());
 for(let i=0;i<850;i++)p.tick({right:true},1/60);
 const s=p.getState();assert.ok(Math.hypot(s.x,s.z)<=ARENA_RADIUS+1e-8);
 assert.ok(s.x>ARENA_RADIUS-0.1);
 const f=p.getFrame();near(f.position.x,s.x);
});
test('reset clears native pose and Motion frame, but preserves actor possession',()=>{
 const e=createGameEngine(),p=createPlayerMotion(e);
 for(let i=0;i<50;i++)p.tick({forward:true},1/60);
 p.reset();const state=p.getState();near(state.x,0);near(state.z,0);
 assert.equal(state.sequence,0);assert.equal(e.n.motion.getMotionFrame(),null);
 assert.equal(e.n.player.getControlledCharacter('local-player').character.id,'roj-fighter');
});
