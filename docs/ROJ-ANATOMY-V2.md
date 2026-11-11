# ROJ-0017: five high-impact anatomy improvements

This is a bounded replacement of the default articulated character presentation, requested after the user reviewed the disconnected 66-part preview. It does not merge the pending ROJ-0013 combat candidate, change movement authority, alter GitHub Actions, or replace any legacy GLB/Blender source.

## Implemented

1. **Continuous body:** replace overlapping open lofts and attached skin primitives with one welded, closed skinned surface. Shoulders, neck, pelvis, wrists, knees and ankles share topology. Clothes/scalp are color regions on that same surface, eliminating colliding collars and waist shells.
2. **Coherent proportions:** reduce the oversized head, rebalance ribcage/waist/pelvis and taper the arms and legs. The selected stylized target is approximately 7.2 head-heights; it is an art direction, not a universal anatomical rule.
3. **Joint alignment and deformation:** preserve all 22 actual existing bone names (the old comment incorrectly called them 24), align knees/elbows to the skin, blend at most four normalized influences and restore complete transforms on reset. Idle legs no longer default to a deep bend. Motion and native IK ownership remain in NexusEngine.
4. **Integrated face:** blend the jaw, chin, nose and ears into the head; recess the orbits and use small inset eyes. The hair follows the skull instead of being a detached cap. This is still a stylized face, not an anatomical scan.
5. **Hands and feet:** taper palms/fingers, distinguish the thumb, shorten oversized feet, shape heel/instep/forefoot and merge toes into the skin. Existing wrist/foot/toe bones are retained; individual finger articulation is not claimed.

## Source and ownership

- `src/animation/anatomical-surface.js`: deterministic welded geometry, bind-pose landmarks, skin influences and canonical Nexus mesh conversion.
- `src/animation/anatomical-pose.js`: presentation-only gait/actions; never changes the supplied simulation state.
- `src/animation/articulated-fighter.js`: existing public factory/API, now a thin Three.js adapter over the shared source.
- `scripts/author-unified-fighter.mjs`: native Nexus Authoring mesh/rig/skin/material/assembly/export/import path, rebasing the original 16 clips onto the new rest transforms. Run `npm run author:unified`. Historical authoring scripts and GLBs remain unchanged.

The generated body has 32,424 vertices and 64,844 triangles at the default source resolution. It is one connected watertight component with consistent winding and normalized skin weights. The default surface is generated once and cached; reset does not regenerate geometry. Local Node construction was approximately 1.4 seconds, not a browser-performance measurement.

## Evidence from this pass

- Node v22.16.0: `node --test tests/anatomical-surface.test.mjs tests/articulated-fighter.test.mjs` — 13 passed, 0 failed.
- Tests cover manifold edges, consistent winding, connectedness, normal lengths, finite values, nonzero triangles, proportion bounds, skin influence limits, material leakage, canonical conversion, gait/IK delegation, input-state immutability, all 16 action names and reset.
- Python/trimesh independently reported one watertight component and consistent winding.
- Three-view and four-pose **source-geometry** renders were inspected in the sandbox. These are CPU geometry/skinning review renders, not Blender renders or screenshots of the deployed WebGL game.
- Full game build/tests/deployment are verified separately through the unchanged existing GitHub workflow after push. A native `author:unified` GLB export was not run locally because the complete pinned engine installation was unavailable. Do not claim that GLB was generated.

## Remaining review

User visual/code review is still welcome. The model is a more coherent stylized humanoid, not a medical-quality anatomical asset. Fine facial sculpting, individual finger animation, retopology/UV authoring, and native exported-GLB acceptance are separate from this requested five-change live-model pass.
