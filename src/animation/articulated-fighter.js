// ROJ-0012..0016 — runtime anatomical prototype.
// A skinned 24-bone fighter with two-bone sagittal foot placement.
// Three.js remains presentation only: NexusEngine owns authoritative motion.
import * as THREE from 'three';
const PI=Math.PI, TAU=2*PI;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function solveLeg(hipY,ankleY,ankleZ,upper=.45,lower=.42){
 const dy=ankleY-hipY,dz=ankleZ;
 const d=clamp(Math.hypot(dy,dz),.09,upper+lower-.001);
 const aim=Math.atan2(-dz,-dy);
 const hip=aim+Math.acos(clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1));
 const knee=-(PI-Math.acos(clamp((upper*upper+lower*lower-d*d)/(2*upper*lower),-1,1)));
 return {hip,knee,ankle:-hip-knee,reach:d};
}
export function gaitTargets(phase,speed,action){
 const athletic=action==='run'||action==='sprint',stride=athletic?.36:.23;
 const stance=action==='idle'||action==='block'||action==='crouch_idle'||action==='light_attack';
 return [-1,1].map((side,i)=>{
  const p=phase+(i?PI:0),travel=Math.cos(p),lift=Math.max(0,Math.sin(p));
  return {z:stance?0:-travel*stride,y:.11+(stance?0:lift*(athletic?.19:.11))};
 });
}
export function createArticulatedFighter({solveIK}={}){
 const group=new THREE.Group(),bones=new Map(),all=[];
 const add=(name,parent,x,y,z)=>{
  const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);
  (parent?bones.get(parent):group).add(b);bones.set(name,b);all.push(b);return b;
 };
 add('root',null,0,0,0);
 add('pelvis','root',0,1.0,0);
 add('spine','pelvis',0,.23,0);
 add('chest','spine',0,.36,0);
 add('neck','chest',0,.24,0);
 add('head','neck',0,.17,0);
 for(const side of ['l','r']){
  const x=side==='l'?.19:-.19,armX=side==='l'?.41:-.41;
  add(side+'_thigh','pelvis',x,-.06,0);
  add(side+'_shin',side+'_thigh',0,-.45,0);
  add(side+'_foot',side+'_shin',0,-.42,0);
  add(side+'_toe',side+'_foot',0,-.04,-.13);
  add(side+'_upper_arm','chest',armX,.07,0);
  add(side+'_forearm',side+'_upper_arm',0,-.37,0);
  add(side+'_wrist',side+'_forearm',0,-.29,0);
  add(side+'_hand',side+'_wrist',0,-.04,0);
 }
 group.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(all);
 const skin=new THREE.MeshStandardMaterial({color:0xc9977b,roughness:.83,side:THREE.FrontSide});
 const cloth=new THREE.MeshStandardMaterial({color:0x353940,roughness:.93});
 const hair=new THREE.MeshStandardMaterial({color:0x352b25,roughness:.88});
 const eye=new THREE.MeshStandardMaterial({color:0x342f2a,roughness:.6});
 const lip=new THREE.MeshStandardMaterial({color:0x945c52,roughness:.9});
 const vertex=(p,inds,ws,positions,indices,weights)=>{
  positions.push(...p);indices.push(...inds);weights.push(...ws);
 };
 // Ring loft in rest/world coordinates, with joint-adjacent normalized weights.
 function loft(rings,material,weightsForY){
  const positions=[],indices=[],weights=[],faces=[],n=20;
  for(let r=0;r<rings.length;r++){
   const [cx,y,cz,rx,rz]=rings[r];
   const pairs=weightsForY(y);
   for(let k=0;k<n;k++){
    const a=k*TAU/n;
    vertex([cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz],
     pairs.map(p=>p[0]).concat([0,0,0,0]).slice(0,4),
     pairs.map(p=>p[1]).concat([0,0,0,0]).slice(0,4),
     positions,indices,weights);
    if(r>0){
     const a0=(r-1)*n+k,b0=(r-1)*n+(k+1)%n,c0=r*n+k,d0=r*n+(k+1)%n;
     faces.push(a0,c0,b0,b0,c0,d0);
    }
   }
  }
  // The loft is open at joint boundaries, hidden by overlapping anatomy.
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  geo.setIndex(faces);geo.computeVertexNormals();
  const mesh=new THREE.SkinnedMesh(geo,material);
  mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
  group.add(mesh);mesh.bind(skeleton);return mesh;
 }
 const id=name=>all.indexOf(bones.get(name));
 const blend=(a,b,t)=>[[id(a),1-t],[id(b),t]];
 const fixed=name=>[[id(name),1]];
 loft([[0,1.02,0,.28,.19],[0,1.10,0,.27,.18],[0,1.23,0,.25,.17],[0,1.38,0,.32,.19],
  [0,1.51,0,.39,.22],[0,1.64,0,.39,.21],[0,1.72,0,.30,.17],[0,1.79,0,.17,.12]],skin,
  y=>y<1.19?fixed('pelvis'):y<1.37?blend('pelvis','spine',(y-1.19)/.18):
  y<1.55?blend('spine','chest',(y-1.37)/.18):fixed('chest'));
 loft([[0,.90,0,.27,.17],[0,.99,0,.30,.19],[0,1.09,0,.28,.19],[0,1.16,0,.26,.175]],cloth,()=>fixed('pelvis'));
 for(const side of ['l','r']){
  const sign=side==='l'?1:-1,x=sign*.19,ax=sign*.41;
  loft([[x,.12,0,.092,.095],[x,.19,0,.095,.093],[x,.32,0,.115,.11],
   [x,.43,0,.12,.12],[x,.49,0,.125,.12],[x,.54,0,.135,.125],
   [x,.68,0,.17,.15],[x,.82,0,.19,.165],[x,.95,0,.165,.16]],skin,
   y=>y<.45?fixed(side+'_shin'):y<.56?
    blend(side+'_shin',side+'_thigh',(y-.45)/.11):fixed(side+'_thigh'));
  loft([[ax,.80,0,.076,.084],[ax,.88,0,.085,.09],[ax,1.03,0,.105,.105],
   [ax,1.18,0,.12,.12],[ax,1.23,0,.123,.12],[ax,1.29,0,.128,.13],
   [ax,1.43,0,.155,.15],[ax,1.57,0,.17,.16],[ax,1.68,0,.17,.155]],skin,
   y=>y<1.19?fixed(side+'_forearm'):y<1.31?
    blend(side+'_forearm',side+'_upper_arm',(y-1.19)/.12):fixed(side+'_upper_arm'));
 }
 const attach=(parent,geo,material,p,scale=null)=>{
  const m=new THREE.Mesh(geo,material);m.position.set(...p);
  if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;
  bones.get(parent).add(m);return m;
 };
 attach('neck',new THREE.SphereGeometry(.104,16,12),skin,[0,.07,0],[1,1.6,.85]);
 attach('head',new THREE.SphereGeometry(.205,28,20),skin,[0,.06,0],[.89,1.16,.93]);
 attach('head',new THREE.SphereGeometry(.074,12,10),skin,[0,.015,-.185],[.68,1.05,1.03]);
 for(const s of [-1,1]){
  attach('head',new THREE.SphereGeometry(.047,12,10),skin,[s*.094,.073,-.153],[1.15,.6,.53]);
  attach('head',new THREE.SphereGeometry(.018,12,10),eye,[s*.092,.079,-.181]);
  attach('head',new THREE.SphereGeometry(.058,12,10),skin,[s*.188,-.005,0],[.5,.9,.8]);
 }
 attach('head',new THREE.SphereGeometry(.07,16,8),lip,[0,-.085,-.15],[.94,.12,.26]);
 attach('head',new THREE.SphereGeometry(.19,20,12),hair,[0,.214,.035],[.93,.26,.91]);
 for(const side of ['l','r']){
  attach(side+'_hand',new THREE.SphereGeometry(.082,14,10),skin,[0,-.08,-.008],[.86,1.38,.65]);
  for(let f=0;f<4;f++)
   attach(side+'_hand',new THREE.CapsuleGeometry(.014,.07,3,6),skin,
    [(f-1.5)*.032,-.167,-.021]);
  attach(side+'_foot',new THREE.SphereGeometry(.118,16,12),skin,[0,-.055,-.125],[1.02,.54,1.9]);
 }
 // The actor faces negative Z; all gait joints are named for runtime look and IK.
 let phase=0,phaseSpeed=0;
 const neutral=new Map([...bones].map(([name,b])=>[name,b.rotation.clone()]));
 function update({dt=1/60,state,action='idle',moving=true}={}){
  const velocity=Math.hypot(state?.vx||0,state?.vz||0);
  const locomoting=moving&&velocity>.16&&['walk','run','sprint','strafe_left','strafe_right','backward_walk','crouch_walk'].includes(action);
  const targetRate=locomoting?velocity/(action==='sprint'?.96:action==='run'?.90:.79)*TAU:0;
  phaseSpeed+=(targetRate-phaseSpeed)*clamp(dt*11,0,1);phase=(phase+phaseSpeed*dt)%TAU;
  const targets=gaitTargets(phase,velocity,locomoting?action:'idle');
  const bend=locomoting?1:0;
  for(const [i,side] of ['l','r'].entries()){
   const thigh=bones.get(side+'_thigh'),shin=bones.get(side+'_shin'),foot=bones.get(side+'_foot');
   const stance=targets[i],crouch=action.startsWith('crouch')?.19:0;
   let pose=solveLeg(.94-crouch,stance.y,stance.z*bend);
   if(typeof solveIK==='function'){
    const root={x:0,y:.94-crouch,z:0};
    const target={x:0,y:stance.y,z:stance.z*bend};
    const result=solveIK({root,target,upperLength:.45,lowerLength:.42,
     poleDirection:{x:0,y:0,z:-1}});
    if(result?.mid&&result?.end){
     const hip=Math.atan2(-result.mid.z,root.y-result.mid.y);
     const shinWorld=Math.atan2(-(result.end.z-result.mid.z),result.mid.y-result.end.y);
     pose={hip,knee:shinWorld-hip,ankle:-shinWorld};
    }
   }
   thigh.rotation.x=pose.hip;
   shin.rotation.x=pose.knee;
   foot.rotation.x=pose.ankle;
   const swing=Math.sin(phase+i*PI)*bend;
   const upper=bones.get(side+'_upper_arm'),lower=bones.get(side+'_forearm');
   upper.rotation.x=clamp(-swing*(action==='sprint'?.64:.40),-.78,.78);
   lower.rotation.x=-.12-Math.max(0,swing)*.18;
  }
  bones.get('pelvis').rotation.z=locomoting?Math.sin(phase)*.035:0;
  bones.get('chest').rotation.y=locomoting?Math.sin(phase)*.06:0;
  if(action==='block'){
   bones.get('l_upper_arm').rotation.x=-1.05;
   bones.get('r_upper_arm').rotation.x=-1.05;
   bones.get('l_forearm').rotation.x=-.7;
   bones.get('r_forearm').rotation.x=-.7;
  }else if(action==='light_attack'){
   bones.get('r_upper_arm').rotation.x=-1.25;
   bones.get('r_forearm').rotation.x=-.7;
  }else if(action==='jump'||action==='fall'){
   bones.get('l_thigh').rotation.x=.33;bones.get('r_thigh').rotation.x=.33;
   bones.get('l_shin').rotation.x=-.55;bones.get('r_shin').rotation.x=-.55;
  }
 }
 function reset(){phase=0;phaseSpeed=0;for(const [name,rotation] of neutral)bones.get(name).rotation.copy(rotation);}
 return {scene:group,update,reset,bones,skeleton,jointCount:all.length};
}
