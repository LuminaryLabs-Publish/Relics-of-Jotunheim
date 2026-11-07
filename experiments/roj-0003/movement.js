// ROJ-0003 isolated movement prototype. NOT the production NexusEngine motion owner.
export const config=Object.freeze({walk:3.1,run:5.7,acceleration:19,braking:25,airAcceleration:7,jumpSpeed:7.5,gravity:19,dodgeSpeed:11,dodgeDuration:.25,dodgeCooldown:.7});
export const createState=()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,grounded:true,dodgeRemaining:0,dodgeCooldown:0,heading:0,animation:'idle',landingRemaining:0});
const toward=(a,b,max)=>a+Math.max(-max,Math.min(max,b-a));
export function step(s,i,delta,c=config){
 const dt=Math.max(0,Math.min(delta,.05));if(!dt)return s;
 s.dodgeRemaining=Math.max(0,s.dodgeRemaining-dt);s.dodgeCooldown=Math.max(0,s.dodgeCooldown-dt);s.landingRemaining=Math.max(0,s.landingRemaining-dt);
 const f=Number(!!i.forward)-Number(!!i.backward),r=Number(!!i.right)-Number(!!i.left),m=Math.hypot(f,r),yaw=i.cameraYaw||0;
 const dx=m?(Math.cos(yaw)*r-Math.sin(yaw)*f)/m:0,dz=m?(-Math.sin(yaw)*r-Math.cos(yaw)*f)/m:0;
 if(i.dodgePressed&&s.grounded&&s.dodgeCooldown===0){s.dodgeRemaining=c.dodgeDuration;s.dodgeCooldown=c.dodgeCooldown;}
 if(i.jumpPressed&&s.grounded&&s.dodgeRemaining===0){s.vy=c.jumpSpeed;s.grounded=false;}
 const speed=s.dodgeRemaining>0?c.dodgeSpeed:i.sprint?c.run:c.walk;
 const a=s.grounded?(m?c.acceleration:c.braking):c.airAcceleration;
 s.vx=toward(s.vx,dx*speed,a*dt);s.vz=toward(s.vz,dz*speed,a*dt);
 if(s.dodgeRemaining>0&&!m){s.vx=toward(s.vx,Math.sin(s.heading)*c.dodgeSpeed,c.acceleration*dt);s.vz=toward(s.vz,-Math.cos(s.heading)*c.dodgeSpeed,c.acceleration*dt);}
 if(m)s.heading=Math.atan2(dx,-dz);
 s.x+=s.vx*dt;s.z+=s.vz*dt;
 if(!s.grounded){s.vy-=c.gravity*dt;s.y+=s.vy*dt;if(s.y<=0){s.y=0;s.vy=0;s.grounded=true;s.landingRemaining=.16;}}
 const v=Math.hypot(s.vx,s.vz);
 s.animation=s.dodgeRemaining>0?'dodge':!s.grounded?'jump':s.landingRemaining>0?'land':v<.2?'idle':v>(c.walk+c.run)/2?'run':'walk';
 return s;
}
