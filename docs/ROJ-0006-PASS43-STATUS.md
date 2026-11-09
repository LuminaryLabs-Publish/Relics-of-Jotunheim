# ROJ-0006 — Pass 43 elbow/knee joint integration

Development preview only: Pass 43 replaces Pass 32 as the preferred fighter. Earlier binaries are preserved and load automatically if the preferred GLB is missing or incompatible.

## Source and evidence
- Input: anatomical Pass 42, derived from Pass 32; sandbox source and receipts in the ROJ-0006 joint-upgrade pack.
- Game binary: `assets/glb/fighter-pass43-elbow-knee-rig-animated.glb`
- SHA-256: `1c0473c415fa1dd6ef19a2e25138703b8625fac54dae846ea7d833a226d78645`
- Git SHA-1: `be8216790e06217a784b642eac3a3e975023a6d7`; binary transfer verified against source.
- 10,252 mesh vertices, 20,500 triangles, 18 skinned joints (14 original + four new l/r elbow and knee controls), 16 named animation clips.
- New joints are animated in all 16 clips; head/neck/chest remain compatible with existing additive head-look controller.
- Existing Pass 32 and v2 GLBs unchanged.

## Integration
`FIGHTER_ASSETS` is the single source of truth for preferred, fallback and legacyFallback editions. The browser loader validates 16 animation names and the four new Pass 43 hinge bones before selecting it, otherwise tries the older editions. `setFighterAsset` synchronizes the NexusEngine creature body descriptor with the actual loaded GLB. No gameplay, NexusEngine Core or GitHub Actions changes.

## Acceptance still pending
Sandbox CPU skinning and glTF structural checks passed; live 3D skin deformation/crossfade/foot-planting and 60-second authentic gameplay video remain unverified in this sandbox. This is a playable feedback asset, not final anatomical approval.

## Visual regression and safe downgrade

A later real-game screenshot showed a largely torso-only silhouette. This contradicts the Pass 43 CPU preview and blocks its visual acceptance. The Pass 43 GLB is retained for opt-in investigation, but the game defaults to the previously visible Pass 32 fighter pending real WebGL deformation checks. Camera collision allowed an unsafe 0.8-unit minimum; a separate hotfix now enforces the 3.4-unit normal minimum. See `docs/ROJ-0006-PASS44-HOTFIX.md`. Neither issue should be described as fully resolved solely by automated GLB integrity tests.
