# ROJ-0006 — Active v3 feedback build
Status: Experimental feedback build, **not** anatomical acceptance.

## Active loader
`src/main.js` prefers `assets/glb/fighter-anatomical-pass32-REVIEW.glb`, with `fighter-rigged-v2.glb` retained as an automatic load/clip fallback. The HUD displays `Model: v3 feedback` when the new model loads, or `Model: v2 fallback` if it cannot be used.

## Evidence and limitations
The experimental GLB is 1,729,856 bytes, contains one skin, one mesh and sixteen named animation clips. Its content was transferred intact and its Git blob SHA verified as `82c7ca5ec0b0b8474cfd10ec9cffc0f4c1a505e4`.

Offline modeling passes 31–32 retain the skeleton and animation content, but anatomy and deformation **have not passed final visual approval**. Native NexusEngine Authoring export/reimport, independent browser gameplay and a new 60-second recording were not completed in this release.

The purpose of this change is to enable hands-on in-game visual feedback. It does not complete ROJ-0006 or ROJ-0005. No change was made to motion/physics, NexusEngine Core, or GitHub Actions.

## Rollback
The original `assets/glb/fighter-rigged-v2.glb` remains available. To restore it as the primary asset, change the loader's preferred URL back to v2.
