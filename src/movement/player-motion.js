// ROJ-0011: NexusEngine's native deterministic locomotion and world contact are the
// sole owners of physics state. This adapter maps game inputs and animation-facing.
import { advanceActionLocomotion,createActionLocomotionState } from 'nexusengine/domains/simulation/motion/locomotion';
import { resolveWorldContact } from 'nexusengine/domains/simulation/physics/world-contact';
import { createLocomotionContactResponse } from 'nexusengine/domains/simulation/adapters/locomotion-contact-response';
import { createGroundedMovement } from './contact-motion.js';
import { sampleArenaFloor,constrainArenaFrame,ARENA_RADIUS } from './arena-surface.js';
import { movementVector,moveAngleToward,clamp } from './third-person-camera.js';

export const PLAYER_MOTION_CONFIG=Object.freeze({
 actorId:'roj-fighter',speed:3.1,sprintSpeed:5.7,dashSpeed:11,
 groundAcceleration:26,airAcceleration:7,groundDrag:0.3,airDrag:0.1,
 gravity:19,jumpSpeed:7.5,jumpCooldown:.18,dashCooldown:.7,
 killY:-26,start:{x:0,y:0,z:0},grounded:true
});
const CONTACT_CONFIG=Object.freeze({groundOffset:0,
 bounds:{minX:-18,maxX:18,minZ:-18,maxZ:18}});
const DODGE_SECONDS=.25;
const configTurnRate={ground:Math.PI*3.5,air:Math.PI*2.2,sprint:Math.PI*2.7};

export function createPlayerMotion(engine,{locomotionConfig=PLAYER_MOTION_CONFIG,sample=sampleArenaFloor}={}){
 if(!engine?.n?.motion?.submitIntent)throw new TypeError('NexusEngine Motion Kit is required');
 // The pinned native frame contract omits its computed cooldown fields.
 // Carry those counters in the one corrected state instead of inventing a
 // second independent locomotion simulation.
 const advance=(state,command,config)=>{
  const frame=advanceActionLocomotion(state,command,config);
  const jumpCooldown=Math.max(0,(state.jumpCooldownRemaining??0)-command.delta);
  const dashCooldown=Math.max(0,(state.dashCooldownRemaining??0)-command.delta);
  return {...frame,
   jumpCooldownRemaining:frame.transitions.includes('jump-started')?config.jumpCooldown:jumpCooldown,
   dashCooldownRemaining:frame.transitions.includes('dash-started')?config.dashCooldown:dashCooldown};
 };
 const corrected=({locomotionFrame,contactResult})=>
  constrainArenaFrame(createLocomotionContactResponse({locomotionFrame,contactResult}),ARENA_RADIUS);
 const native=createGroundedMovement({advance,contact:resolveWorldContact,
  respond:corrected,initialState:{...createActionLocomotionState(locomotionConfig),facing:{x:0,y:0,z:-1}},
  locomotionConfig,contactConfig:CONTACT_CONFIG,sample});
 let heading=0,dodgeRemaining=0,dodgeX=0,dodgeZ=-1,landingRemaining=0,lastGrounded=true;
 let animation='idle';
 let lastFrame=null;
 function getState(){
  const s=native.getState(),v=s.velocity,p=s.position;
  return {x:p.x,y:p.y,z:p.z,vx:v.x,vy:v.y,vz:v.z,grounded:s.grounded,
   heading,dodgeRemaining,dodgeCooldown:s.dashCooldownRemaining??0,
   landingRemaining,animation,sequence:s.sequence};
 }
 function tick(input={},dt=1/60){
  const delta=clamp(Number(dt)||0,0,1/30);if(delta<=0)return getState();
  const before=native.getState();
  const vec=movementVector(input,Number(input.cameraYaw)||0);
  if(input.dodgePressed&&before.grounded&&dodgeRemaining<=0&&(before.dashCooldownRemaining??0)<=0){
   dodgeX=vec.magnitude?vec.x:-Math.sin(heading);
   dodgeZ=vec.magnitude?vec.z:-Math.cos(heading);
   dodgeRemaining=DODGE_SECONDS;
  }
  const dodging=dodgeRemaining>0;
  const scale=input.crouch?1.65/locomotionConfig.speed:1;
  const motionInput={
   x:dodging?dodgeX:vec.x*scale,z:dodging?dodgeZ:vec.z*scale,
   sprint:!!input.sprint&&!input.crouch&&!dodging,dash:dodging,
   jump:!!input.jumpPressed&&!dodging
  };
  const next=native.tick(motionInput,delta);
  lastFrame=next;
  dodgeRemaining=Math.max(0,dodgeRemaining-delta);
  landingRemaining=Math.max(0,landingRemaining-delta);
  if(!before.grounded&&next.grounded)landingRemaining=.16;
  const speed=Math.hypot(next.velocity.x,next.velocity.z);
  if(!input.lockFacing&&speed>.12){
   const desiredHeading=Math.atan2(-next.velocity.x,-next.velocity.z);
   const rate=!next.grounded?configTurnRate.air:motionInput.sprint?configTurnRate.sprint:configTurnRate.ground;
   heading=moveAngleToward(heading,desiredHeading,rate*delta);
  }
  animation=dodging?'dodge':!next.grounded?(next.velocity.y<0?'fall':'jump'):
   landingRemaining>0?'land':speed<.2?'idle':speed>(locomotionConfig.speed+locomotionConfig.sprintSpeed)/2?'run':'walk';
  // Core Motion receives the *contact-corrected* result, not the uncorrected intent.
  engine.n.motion.submitIntent({...next.intent,grounded:next.grounded,
   desiredVelocity:{...next.velocity},desiredFacing:{x:-Math.sin(heading),y:0,z:-Math.cos(heading)}});
  engine.n.motion.commitMotionFrame({tickId:`roj:${next.sequence}`,frame:next.sequence,
   requests:[{id:`roj:${next.sequence}:fighter`,bodyId:locomotionConfig.actorId,
    position:{...next.position},linearVelocity:{...next.velocity}}]});
  lastGrounded=next.grounded;
  return getState();
 }
 function reset(){native.reset();heading=0;dodgeRemaining=0;dodgeX=0;dodgeZ=-1;
  landingRemaining=0;lastGrounded=true;animation='idle';lastFrame=null;
  // Clear stale intents/frames on restart; preserve registered Kits and player possession.
  engine.n.motion.reset();
 }
 return {tick,getState,getFrame:()=>structuredClone(lastFrame),reset};
}
