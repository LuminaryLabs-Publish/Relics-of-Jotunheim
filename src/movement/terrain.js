// ROJ-0005: deterministic ground fixture. This is test terrain, not Hymir's Pursuit.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function heightAt(x,z){
  if(x>=2 && x<=6 && z>=-2 && z<=2) return (x-2)*0.25;
  if(x>6 && x<=10 && z>=-2 && z<=2) return 1;
  if(x>=-7 && x<=-3 && z>=-2 && z<=2) return 0.5;
  return 0;
}
export function sampleTerrain(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z)) throw new TypeError('finite coordinates required');
  const y=heightAt(x,z),e=0.005;
  const dx=(heightAt(x+e,z)-heightAt(x-e,z))/(2*e);
  const dz=(heightAt(x,z+e)-heightAt(x,z-e))/(2*e);
  const inv=1/Math.hypot(dx,1,dz);
  return {groundHeight:y,normal:{x:-dx*inv,y:inv,z:-dz*inv},surface:{traction:0.85,stability:0.9,impactHardness:0.45}};
}
// Flat/slope/step fixture solids used only for offline visual acceptance.
export const terrainSections=Object.freeze([
  {name:'level',x0:-11,x1:2,z0:-7,z1:7},
  {name:'slope',x0:2,x1:6,z0:-2,z1:2},
  {name:'plateau',x0:6,x1:10,z0:-2,z1:2},
  {name:'step',x0:-7,x1:-3,z0:-2,z1:2}
]);
