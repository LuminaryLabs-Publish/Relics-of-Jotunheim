# ROJ Anatomical Character — NexusEngine Native Authoring Pass

**Scope:** Character proportions, sculpted topology and authoring pipeline. The ROJ-0017 modeling work is parallel and remains independently owned.  
**Status:** Source implemented and source-geometry reviewed; native GLB export / game visual approval pending.

## Authoritative workflow

The new `scripts/author-anatomical-fighter.mjs` is a separate native NexusEngine Authoring Project, derived from the proven ROJ walk authoring harness without modifying that historical proof. It uses **actual** `n:authoring` operations:

1. `mesh.create` — a capped organic anatomical surface comprised of independently manifold lobes and elliptical contours.
2. `rig.set` — original locomotion bones plus separate hand and foot joints (18 total).
3. `skin.bind` and `skin.weights` — four-influence bounded weights, normalized per vertex.
4. `animation.set` — all 16 previous gameplay clips retained under the original clip IDs.
5. `material.set`, `assembly.set`, `authoringValidation.project`, `authoringAnimation.sample` and `authoringSkin.evaluate` — native source, pose and deformation checks.
6. `authoringExport.export` (GLB) then `authoringImport.import` — real format validation / roundtrip, not merely construction of a mesh data object.

Running `npm run author:anatomical` using the pinned engine creates outputs in `artifacts/roj-anatomical/` including `fighter-anatomical-native-sixteen-clips.glb`, a native receipt and editable canonical source. **The GLB does not exist in this source commit; do not claim the export completed.**

## Geometry and outcome

- Rest shape retains the existing player-facing negative-Z convention and the active animation clip names.
- Approximate source body spans Y=-0.018 to 2.364 world units, including foot and hair. Loft has distinct waist, ribs, shoulders, traps, gluteal transition, tapered upper/forearms and thighs/calves.
- Head includes cranium, chin/jaw, nose bridge/tip, eye forms, ears, brow and hair volumes.
- Both hands have a palm, thumb and four finger lengths; feet have forefeet and five independent toe volumes.
- Native mesh source: 7,316 vertices; 7,494 faces; 14,452 triangulated triangles; 0 nonmanifold edges; 0 inconsistent edge windings; 0 degenerate triangles under 1e-10 cross-product threshold; every source vertex's assigned skin influences sum to 1.
- The exact proportion and facial treatment are a stylized anatomical **proposal**, not medical-grade human anatomy or artist acceptance.

## Live preview / safe integration

The default `src/animation/articulated-fighter.js` remains the working 24-joint playable fighter with native Motion/TwoBoneIK ownership unchanged. The profile has been re-contoured for more credible anatomy; head, nose, jaw and feet have refined presentation. All existing GLB fallbacks remain intact; older authored/source assets are unchanged.

This is the only live runtime change in this pass. The newly authored GLB is intentionally not added to default load order until it exists, passes native export/roundtrip and receives code/visual review.

## Evidence & gates

Source-reviewed: `tests/anatomical-authoring.test.mjs` four self-contained tests passed in a local isolated JavaScript evaluator, checking required native API calls, closed manifold source, normalised weights and runtime profile preservation. The source script parses and its pure geometry construction was inspected. This is **not** proof of a native project save, GLB export, or WebGL visual behavior.

Pending: run the new authoring script in a complete pinned NexusEngine install, inspect native diagnostics and exported GLB, import test, measure clip movement and skin deformation, compare front/side/back rendered views and multiple animation poses (walking, running, attacking, crouching, jumping), inspect elbows/ankles and hands. Make adjustments if needed. Preserve the existing model if quality is lower.

**Restrictions:** Do not change NexusEngine Core, GitHub Actions, legacy fighter GLBs, model agent's independent working files, combat ownership, or scene loading as part of this pass.
