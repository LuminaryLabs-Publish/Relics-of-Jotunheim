// ROJ-0009: host-side additive skeletal presentation; not a NexusEngine Motion owner.
import { clamp, wrapAngle, smoothFactor } from '../movement/third-person-camera.js';

export const LOOK_LIMITS=Object.freeze({yaw:Math.PI/3,pitch:Math.PI/6,rate:9});
export function lookTarget(cameraYaw,cameraPitch,bodyHeading,limits=LOOK_LIMITS){
  // Both camera yaw and body heading use the same horizontal world convention.
  // Subtract their orientations; aligned view and body must produce zero look.
  const relative=wrapAngle(cameraYaw-bodyHeading);
  return {yaw:clamp(relative,-limits.yaw,limits.yaw),pitch:clamp(-cameraPitch,-limits.pitch,limits.pitch)};
}
export function lookWeight(action,locked){
  if(!locked)return 0;
  if(action==='dodge'||action==='light_attack'||action==='heavy_landing')return 0;
  if(action==='block')return .15;
  if(action==='sprint')return .25;
  if(action==='run'||action==='jump'||action==='fall')return .45;
  return 1;
}
export function createHeadLook(root){
  const found=new Map();
  root?.traverse?.(node=>{if(node.isBone&&['head','neck','chest'].includes(node.name.toLowerCase()))found.set(node.name.toLowerCase(),node);});
  if(!found.has('head')||!found.has('neck'))return null;
  const bones=[{node:found.get('chest'),yaw:.12,pitch:.1},{node:found.get('neck'),yaw:.33,pitch:.35},{node:found.get('head'),yaw:.55,pitch:.55}].filter(x=>x.node);
  const baseline=new Map();
  let yaw=0,pitch=0;
  // Before AnimationMixer.update, remove last frame's additive offsets.
  // This is necessary even for unanimated bones: otherwise rotations accumulate.
  function beforeAnimation(){for(const {node} of bones){const q=baseline.get(node);if(q)node.quaternion.copy(q);}}
  function afterAnimation({cameraYaw,cameraPitch,bodyHeading,action,locked,dt}){
    const weight=lookWeight(action,locked);
    const target=lookTarget(cameraYaw,cameraPitch,bodyHeading);
    const t=smoothFactor(LOOK_LIMITS.rate,dt);
    yaw+=(target.yaw*weight-yaw)*t;pitch+=(target.pitch*weight-pitch)*t;
    for(const {node,yaw:yw,pitch:pw} of bones){
      const base=node.quaternion.clone();baseline.set(node,base);
      const Q=node.quaternion.constructor;
      const yq=new Q().setFromAxisAngle({x:0,y:1,z:0},yaw*yw);
      const pq=new Q().setFromAxisAngle({x:1,y:0,z:0},pitch*pw);
      node.quaternion.copy(base).multiply(yq).multiply(pq);
    }
  }
  function reset(){beforeAnimation();baseline.clear();yaw=0;pitch=0;}
  return {beforeAnimation,afterAnimation,reset,getState:()=>({yaw,pitch,bones:bones.map(b=>b.node.name)})};
}
