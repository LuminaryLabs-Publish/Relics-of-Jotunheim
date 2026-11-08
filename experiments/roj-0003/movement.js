// ROJ-0003 deterministic compatibility adapter; not a native NexusEngine Motion owner.
// ROJ-0007 preserves this boundary until ROJ-0005 owns world contact / simulation.
import {movementVector,moveAngleToward,clamp} from '../../src/movement/third-person-camera.js';
export const config=Object.freeze({walk:3.1,run:5.7,acceleration:23,braking:29,airAcceleration:7,
 jumpSpeed:7.5,gravity:19,dodgeSpeed:11,dodgeDuration:.25,dodgeCooldown:.7,
 turnRate:Math.PI*3.5,airTurnRate:Math.PI*2.2,sprintTurnRate:Math.PI*2.7});
export const createState=()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,grounded:true,dodgeRemaining:0,dodgeCooldown:0,
 dodgeX:0,dodgeZ:-1,heading:0,animation:'idle',landingRemaining:0});
const approachVector=(vx,vz,tx,tz,step)=>{
 const dx=tx-vx,dz=tz-vz,length=Math.hypot(dx,dz);
 if(length<=step||!length)return {x:tx,z:tz};
 const scale=step/length;return {x:vx+dx*scale,z:vz+dz*scale};
};
export function step(s,input,delta,c=config){
 const dt=clamp(Number(delta)||0,0,.05);if(!dt)return s;
 s.dodgeRemaining=Math.max(0,s.dodgeRemaining-dt);
 s.dodgeCooldown=Math.max(0,s.dodgeCooldown-dt);
 s.landingRemaining=Math.max(0,s.landingRemaining-dt);
 const {x:dx,z:dz,magnitude}=movementVector(input,Number(input.cameraYaw)||0);
 if(input.dodgePressed&&s.grounded&&s.dodgeCooldown<=0){
  const wanted=magnitude?{x:dx,z:dz}:{x:Math.sin(s.heading),z:-Math.cos(s.heading)};
  s.dodgeX=wanted.x;s.dodgeZ=wanted.z;
  s.dodgeRemaining=c.dodgeDuration;s.dodgeCooldown=c.dodgeCooldown;
 }
 if(input.jumpPressed&&s.grounded&&s.dodgeRemaining===0){s.vy=c.jumpSpeed;s.grounded=false;}
 if(s.dodgeRemaining>0){s.vx=s.dodgeX*c.dodgeSpeed;s.vz=s.dodgeZ*c.dodgeSpeed;}
 else {
  const speed=input.sprint?c.run:c.walk;
  const a=s.grounded?(magnitude?c.acceleration:c.braking):c.airAcceleration;
  const v=approachVector(s.vx,s.vz,dx*speed,dz*speed,a*dt);
  s.vx=v.x;s.vz=v.z;
 }
 if(magnitude&&s.dodgeRemaining===0){
  const desiredHeading=Math.atan2(dx,-dz);
  const rate=(!s.grounded?c.airTurnRate:input.sprint?c.sprintTurnRate:c.turnRate)??Math.PI*3.5;
  s.heading=moveAngleToward(s.heading,desiredHeading,rate*dt);
 }
 s.x+=s.vx*dt;s.z+=s.vz*dt;
 if(!s.grounded){
  s.vy-=c.gravity*dt;s.y+=s.vy*dt;
  if(s.y<=0){s.y=0;s.vy=0;s.grounded=true;s.landingRemaining=.16;}
 }
 const v=Math.hypot(s.vx,s.vz);
 s.animation=s.dodgeRemaining>0?'dodge':!s.grounded?'jump':s.landingRemaining>0?'land':
             v<.2?'idle':v>(c.walk+c.run)/2?'run':'walk';
 return s;
}
