// Pose-only articulation. NexusEngine remains the sole movement/ground-contact owner.
import {ANATOMY,anatomicalRig} from './anatomical-surface.js';
const PI=Math.PI,TAU=2*PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function solveLeg(hipY,ankleY,ankleZ,upper=ANATOMY.upperLeg,lower=ANATOMY.lowerLeg){
 const dy=ankleY-hipY,dz=ankleZ;
 const d=clamp(Math.hypot(dy,dz),Math.abs(upper-lower)+.001,upper+lower-.001);
 const aim=Math.atan2(-dz,-dy);
 const hip=aim+Math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1));
 const knee=-(PI-Math.acos(clamp((upper*upper+lower*lower-d*d)/(2*upper*lower),-1,1)));
 return {hip,knee,ankle:-hip-knee,reach:d};
}
export function gaitTargets(phase,speed,action){
 const athletic=action==='run'||action==='sprint',stride=athletic?.33:.23;
 const stance=speed<.16||!['walk','run','sprint','strafe_left','strafe_right','backward_walk','crouch_walk'].includes(action);
 return [-1,1].map((side,i)=>{
  const p=phase+(i?PI:0),lift=Math.max(0,Math.sin(p));
  return {z:stance?0:-Math.cos(p)*stride,y:ANATOMY.ankleY+(stance?0:lift*(athletic?.17:.10))};
 });
}
export function createAnatomicalPose({solveIK}={}){
 const rig=anatomicalRig();let phase=0,phaseSpeed=0;
 const pose=Object.fromEntries(rig.map(b=>[b.name,{position:[...b.position],rotation:[0,0,0]}]));
 function reset(){phase=0;phaseSpeed=0;for(const b of rig){pose[b.name].position=[...b.position];pose[b.name].rotation=[0,0,0];}}
 function update({dt=1/60,state={},action='idle',moving=true}={}){
  dt=Number.isFinite(dt)?clamp(dt,0,.1):0;
  const velocity=Math.hypot(state?.vx||0,state?.vz||0);
  const locomoting=moving&&velocity>.16&&['walk','run','sprint','strafe_left','strafe_right','backward_walk','crouch_walk'].includes(action);
  const athletic=action==='run'||action==='sprint';
  const targetRate=locomoting?clamp(velocity/(athletic?3.8:2.4),.45,2.6)*TAU:0;
  const alpha=1-Math.exp(-13*dt);
  phaseSpeed+=(targetRate-phaseSpeed)*(1-Math.exp(-11*dt));phase=(phase+phaseSpeed*dt)%TAU;
  const targets=gaitTargets(phase,velocity,locomoting?action:'idle');
  const crouch=action.startsWith('crouch')?.18:0;
  const pelvis=pose.pelvis;
  pelvis.position[1]+=(ANATOMY.pelvisY-crouch-pelvis.position[1])*alpha;
  for(const [i,side] of ['l','r'].entries()){
   const stance=targets[i],hipY=pelvis.position[1]-.04;
   let leg=solveLeg(hipY,stance.y,stance.z);
   if(typeof solveIK==='function'){
    const root={x:0,y:hipY,z:0},target={x:0,y:stance.y,z:stance.z};
    const result=solveIK({root,target,upperLength:ANATOMY.upperLeg,lowerLength:ANATOMY.lowerLeg,poleDirection:{x:0,y:0,z:-1}});
    if(result?.mid&&result?.end&&[result.mid.y,result.mid.z,result.end.y,result.end.z].every(Number.isFinite)){
     const hip=Math.atan2(-result.mid.z,root.y-result.mid.y);
     const shinWorld=Math.atan2(-(result.end.z-result.mid.z),result.mid.y-result.end.y);
     leg={hip,knee:shinWorld-hip,ankle:-shinWorld};
    }
   }
   const thigh=pose[side+'_thigh'],shin=pose[side+'_shin'],foot=pose[side+'_foot'];
   thigh.rotation[0]+=(leg.hip-thigh.rotation[0])*alpha;
   shin.rotation[0]+=(leg.knee-shin.rotation[0])*alpha;
   foot.rotation[0]+=(leg.ankle-foot.rotation[0])*alpha;
   pose[side+'_toe'].rotation[0]+=(0-pose[side+'_toe'].rotation[0])*alpha;
   const swing=locomoting?Math.sin(phase+i*PI):0;
   const upper=pose[side+'_upper_arm'],fore=pose[side+'_forearm'];
   const arm=-swing*(athletic?.54:.32),elbow=.10+Math.max(0,swing)*.20;
   upper.rotation[0]+=(arm-upper.rotation[0])*alpha;
   fore.rotation[0]+=(elbow-fore.rotation[0])*alpha;
   upper.rotation[2]+=(0-upper.rotation[2])*alpha;
  }
  pelvis.rotation[2]+=((locomoting?Math.sin(phase)*.025:0)-pelvis.rotation[2])*alpha;
  pose.chest.rotation[1]+=((locomoting?Math.sin(phase)*.04:0)-pose.chest.rotation[1])*alpha;
  pose.chest.rotation[0]+=(0-pose.chest.rotation[0])*alpha;
  if(action==='block'){
   for(const side of ['l','r']){
    pose[side+'_upper_arm'].rotation[0]=.55;
    pose[side+'_upper_arm'].rotation[2]=(side==='l'?-1:1)*.25;
    pose[side+'_forearm'].rotation[0]=1.75;
   }
  }else if(action==='light_attack'){
   // Positive local X raises a downward-resting arm toward the actor's -Z front.
   pose.r_upper_arm.rotation[0]=1.25;pose.r_forearm.rotation[0]=.15;
  }else if(action==='jump'||action==='fall'){
   for(const side of ['l','r']){
    pose[side+'_thigh'].rotation[0]+=(.33-pose[side+'_thigh'].rotation[0])*alpha;
    pose[side+'_shin'].rotation[0]+=(-.55-pose[side+'_shin'].rotation[0])*alpha;
   }
  }else if(action==='dodge'){
   pose.chest.rotation[0]+=(.35-pose.chest.rotation[0])*alpha;
   pelvis.rotation[2]+=(.14-pelvis.rotation[2])*alpha;
  }else if(action==='land'||action==='heavy_landing'){
   pelvis.position[1]+=(ANATOMY.pelvisY-(action==='heavy_landing'?.15:.06)-pelvis.position[1])*alpha;
  }
  return pose;
 }
 reset();return {update,reset,getPose:()=>pose};
}
