# ROJ-0006 — Pass 45 skin, anatomy and underwear game integration

**Development feedback edition; real-game visual acceptance pending.**

## Origin and scope
- Generated in the sandbox from the stable Pass 32 fighter, not the quarantined 18-joint Pass 43 experiment.
- New asset: `assets/glb/fighter-pass45-tan-anatomy-briefs.glb`, 2,295,068 bytes.
- Exact SHA-256: `86cfc66907f9fb546ee5e3cd4c9ae81afcf60a6fe77b9cf1afb5abfe6625f4ed`.
- Exact Git blob SHA: `4f47f4814164c506b0c04637ba165fb8dd54f714`.
- Changes: warm tan skin PBR material, skinned matte charcoal briefs with waistband and leg trim, subtle chest details, smoother hip and upper-thigh contours, shoulder/eye silhouette refinements.
- Retains the **same 14 bones** and **all 16 original action clips**; source animation buffers are preserved. Source mesh has 10,252 vertices and 20,500 triangles; clothing/decorations add geometry in five skinned mesh primitives.

## Validation and live integration
- Sandbox `validate_glb.py` rerun: PASS, 49 CPU-skinned pose samples; 16 animation clips, 14 skin joints, normalized weights, watertight original body, 23,719 total triangles, no nonfinite or escaped vertices.
- Active browser GLTFLoader prefers Pass 45; it checks all 16 clips, actual SkinnedMesh and bone hierarchy. If unavailable/incompatible, it retries Pass 32 and v2, updating the NexusEngine Creature descriptor to the loaded edition.
- Stable comparison: `?fighter=pass32`. Quarantined Pass 43: `?fighter=pass43`.
- Existing NexusEngine movement, camera, head look, controls and original GLBs remain unchanged. No GitHub Actions or NexusEngine Core modifications.

## Outstanding gates
Do not equate CPU sample validation or a successful Vite/Pages build to actual deforming gameplay. Inspect all 16 animations and idle, sprint, jump, dodge, combat, hip/underwear surface clearance and face appearance in a GPU-capable WebGL browser. Capture an authentic 60-second gameplay video and obtain visual approval before declaring anatomy final.
