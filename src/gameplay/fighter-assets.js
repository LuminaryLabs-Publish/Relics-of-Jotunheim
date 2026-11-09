// Single source of truth for NexusEngine creature descriptors and browser GLB selection.
export const FIGHTER_ASSETS=Object.freeze({
 preferred:'assets/glb/fighter-pass43-elbow-knee-rig-animated.glb',
 fallback:'assets/glb/fighter-anatomical-pass32-REVIEW.glb',
 legacyFallback:'assets/glb/fighter-rigged-v2.glb'
});
export const REQUIRED_FIGHTER_CLIPS=Object.freeze([
 'walk','idle','run','jump','land','dodge','crouch_idle','crouch_walk',
 'strafe_left','strafe_right','backward_walk','sprint','fall','heavy_landing','block','light_attack'
]);
