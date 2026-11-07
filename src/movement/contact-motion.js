// Integration boundary around existing NexusEngine exported deterministic operations.
// No duplicate authority: the locomotion frame is advanced once per tick, then contact-corrected.
import { sampleTerrain } from './terrain.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createGroundedMovement({advance,contact,respond,initialState,locomotionConfig,contactConfig={groundOffset:0},sample=sampleTerrain}){
  if([advance,contact,respond].some(fn=>typeof fn!=='function')) throw new TypeError('NexusEngine operations required');
  let state=structuredClone(initialState),contactState={grounded:state.grounded,stability:1,sequence:0};
  let last=null;
  function tick(input,rawDelta){
    const delta=clamp(Number(rawDelta)||0,0,1/30);
    if(delta<=0)return last;
    const before=sample(state.position.x,state.position.z);
    const next=advance(state,{delta,input,contact:{groundHeight:before.groundHeight,grounded:true}},locomotionConfig);
    const surface=sample(next.position.x,next.position.z);
    const resolved=contact(contactState,{body:{id:state.actorId,position:next.position,velocity:next.velocity,mass:1},sample:surface},contactConfig);
    const corrected=respond({locomotionFrame:next,contactResult:resolved});
    const pos=corrected.position;
    // Final state matches the one corrected frame. Do not advance a second simulation owner.
    state={...state,position:pos,velocity:corrected.velocity,grounded:corrected.grounded,
      facing:corrected.facing,sequence:next.sequence,jumping:next.jumping,
      jumpCooldownRemaining:next.jumpCooldownRemaining??state.jumpCooldownRemaining,
      dashCooldownRemaining:next.dashCooldownRemaining??state.dashCooldownRemaining};
    contactState={...contactState,grounded:resolved.contact.grounded,stability:resolved.contact.stability,sequence:resolved.sequence};
    last={...corrected,sample:surface,sequence:next.sequence};
    return last;
  }
  return {tick,getState:()=>structuredClone(state),getFrame:()=>structuredClone(last),reset:()=>{
    state=structuredClone(initialState);contactState={grounded:state.grounded,stability:1,sequence:0};last=null;
  }};
}
export function computeFootTarget(hip,foot,sample,{maxReach=1.2,plantWeight=1}={}){
  const floor=sample(foot.x,foot.z).groundHeight;
  const desired={x:foot.x,y:floor,z:foot.z};
  const off={x:desired.x-hip.x,y:desired.y-hip.y,z:desired.z-hip.z};
  const distance=Math.hypot(off.x,off.y,off.z)||1;
  const scale=Math.min(1,maxReach/distance);
  const reachable={x:hip.x+off.x*scale,y:hip.y+off.y*scale,z:hip.z+off.z*scale};
  const w=clamp(plantWeight,0,1);
  return {x:foot.x+(reachable.x-foot.x)*w,y:foot.y+(reachable.y-foot.y)*w,z:foot.z+(reachable.z-foot.z)*w};
}
