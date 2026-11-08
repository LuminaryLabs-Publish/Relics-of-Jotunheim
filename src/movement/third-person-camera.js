// ROJ-0007: pure presentation/input boundary. NexusEngine retains Actor
// ownership; this module does not invent native Motion or camera-domain APIs.
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const wrapAngle=(value)=>Math.atan2(Math.sin(value),Math.cos(value));
export const smoothFactor=(rate,delta)=>1-Math.exp(-Math.max(0,rate)*clamp(delta,0,0.1));
export function moveAngleToward(from,to,maxStep){
  const difference=wrapAngle(to-from);
  return wrapAngle(from+clamp(difference,-Math.max(0,maxStep),Math.max(0,maxStep)));
}
export function movementVector(input,yaw){
  const f=Number(!!input.forward)-Number(!!input.backward);
  const r=Number(!!input.right)-Number(!!input.left);
  const length=Math.hypot(f,r);
  if(!length)return {x:0,z:0,magnitude:0};
  return {x:(Math.cos(yaw)*r-Math.sin(yaw)*f)/length,
          z:(-Math.sin(yaw)*r-Math.cos(yaw)*f)/length,magnitude:1};
}
export const CAMERA_DEFAULTS=Object.freeze({yaw:0,pitch:0.23,distance:6.7,minDistance:3.4,maxDistance:9.5,
  minPitch:0.06,maxPitch:0.94,sensitivity:0.005,focusHeight:1.45,shoulder:0.35,
  followRate:11,collisionPadding:0.23});
export function createCameraState(config=CAMERA_DEFAULTS){
 const c={...CAMERA_DEFAULTS,...config};return {...c,focus:{x:0,y:c.focusHeight,z:0},position:{x:c.shoulder,y:2.95,z:c.distance}};
}
export function orbitCamera(state,deltaX,deltaY){
 if(!Number.isFinite(deltaX)||!Number.isFinite(deltaY))return state;
 state.yaw=wrapAngle(state.yaw+deltaX*state.sensitivity);
 state.pitch=clamp(state.pitch-deltaY*state.sensitivity,state.minPitch,state.maxPitch);
 return state;
}
export function zoomCamera(state,scrollY){
 if(Number.isFinite(scrollY))state.distance=clamp(state.distance+scrollY*0.008,state.minDistance,state.maxDistance);
 return state;
}
export function desiredCameraPosition(state,focus,clippedDistance=state.distance){
 const d=clamp(clippedDistance,Math.min(0.65,state.minDistance),state.maxDistance);
 const sin=Math.sin(state.yaw),cos=Math.cos(state.yaw),horizontal=d*Math.cos(state.pitch);
 return {x:focus.x+sin*horizontal+cos*state.shoulder,
         y:focus.y+d*Math.sin(state.pitch),
         z:focus.z+cos*horizontal-sin*state.shoulder};
}
export function updateCamera(state,character,dt,clipDistance=state.distance){
 const t=smoothFactor(state.followRate,dt);
 const desiredFocus={x:character.x,y:character.y+state.focusHeight,z:character.z};
 for(const axis of ['x','y','z'])state.focus[axis]+=(desiredFocus[axis]-state.focus[axis])*t;
 const target=desiredCameraPosition(state,state.focus,clipDistance);
 for(const axis of ['x','y','z'])state.position[axis]+=(target[axis]-state.position[axis])*t;
 return state;
}
export function cameraPose(state){return {position:{...state.position},target:{...state.focus}};}
