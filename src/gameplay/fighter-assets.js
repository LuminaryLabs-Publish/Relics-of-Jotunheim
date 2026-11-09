// Canonical fighter editions for NexusEngine Actor and browser GLTFLoader.
// Pass 45 is a development feedback build; Pass 32 remains a stable fallback.
export const FIGHTER_ASSETS=Object.freeze({
 preferred:'assets/glb/fighter-pass45-tan-anatomy-briefs.glb',
 fallback:'assets/glb/fighter-anatomical-pass32-REVIEW.glb',
 legacyFallback:'assets/glb/fighter-rigged-v2.glb',
 experimental:'assets/glb/fighter-pass43-elbow-knee-rig-animated.glb'
});
export function fighterLoadOrder({experimental=false,stable=false}={}){
 if(stable)return [FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.legacyFallback];
 return experimental
  ?[FIGHTER_ASSETS.experimental,FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.legacyFallback]
  :[FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.legacyFallback];
}
export const REQUIRED_FIGHTER_CLIPS=Object.freeze([
 'walk','idle','run','jump','land','dodge','crouch_idle','crouch_walk',
 'strafe_left','strafe_right','backward_walk','sprint','fall','heavy_landing','block','light_attack'
]);
