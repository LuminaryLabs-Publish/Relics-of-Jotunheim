// Live preview geometry is a level disc. Do not sample ROJ-0005's invisible slope fixture.
export const ARENA_RADIUS=17.5;
export function sampleArenaFloor(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('Finite coordinates required');
 return {groundHeight:0,normal:{x:0,y:1,z:0},surface:{traction:1,stability:1,impactHardness:.45}};
}
// Game-specific circular boundary applied to the corrected native contact response.
export function constrainArenaFrame(frame,radius=ARENA_RADIUS){
 const p=frame.position,v=frame.velocity,d=Math.hypot(p.x,p.z);
 if(d<=radius)return frame;
 const nx=p.x/d,nz=p.z/d,outward=Math.max(0,v.x*nx+v.z*nz);
 return {...frame,position:{...p,x:nx*radius,z:nz*radius},
   velocity:{...v,x:v.x-outward*nx,z:v.z-outward*nz},
   metadata:{...frame.metadata,arenaBoundaryApplied:true}};
}
