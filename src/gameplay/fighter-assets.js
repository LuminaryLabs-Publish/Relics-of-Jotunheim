// Canonical runtime selection. The 18-joint Pass 43 remains opt-in pending
// actual WebGL skinning acceptance; known-good Pass 32 is the live default.
export const FIGHTER_ASSETS=Object.freeze({
 preferred:'assets/glb/fighter-anatomical-pass32-REVIEW.glb',
 fallback:'assets/glb/fighter-rigged-v2.glb',
 experimental:'assets/glb/fighter-pass43-elbow-knee-rig-animated.glb'
});
export function fighterLoadOrder({experimental=false}={}){
 return experimental
  ?[FIGHTER_ASSETS.experimental,FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback]
  :[FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback];
}
export const REQUIRED_FIGHTER_CLIPS=Object.freeze([
 'walk','idle','run','jump','land','dodge','crouch_idle','crouch_walk',
 'strafe_left','strafe_right','backward_walk','sprint','fall','heavy_landing','block','light_attack'
]);
