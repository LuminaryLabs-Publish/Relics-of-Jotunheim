# Relics of Jotunheim

**Development preview** of the NexusEngine-backed third-person game. Current playable test scene: an arena with a rigged, animated fighter, one training dummy, a simple chasing rival, basic melee damage/blocking, a collectible victory relic, camera-relative locomotion and a fixed visual-only center dot. The full *Hymir's Pursuit* match/scenario, robust combat physics, animation-driven enemy AI, and Quest/Android builds are **not implemented**.

## ROJ-0011 runtime cutover

- **NexusEngine:** Creature/Character/Player registration and possession; native Action Locomotion, World Contact and Locomotion Contact Response contracts; corrected frames published to Core Motion. Two-Bone IK Kit is installed but gameplay foot planting/IK deformation is still future work.
- **Game:** `src/movement/player-motion.js` is the only production locomotion state owner. `experiments/roj-0003/movement.js` remains test/historical code, **not** part of the live game. ROJ-0005's terrain slope fixture is not live arena geometry.
- **Presentation:** Three.js renders the **Pass 45 warm-tan fighter with skinned charcoal briefs and anatomical details** (14 original joints and 16 retained clips) as a development feedback build. Pass 32 and v2 are sequential automatic fallbacks. Use `?fighter=pass32` to compare the stable baseline; Pass 43 remains quarantined behind `?fighter=pass43` pending separate rig repair. The NexusEngine creature descriptor is switched to the actually loaded GLB. Additive head/neck/chest rotations follow camera look in the character's local coordinate system; movement and camera headings are independent.
- **Runtime:** a bounded 60-Hz fixed-step simulation, browser pointer lock requested synchronously from click/L, right-mouse fallback, over-right-shoulder orbit, basic camera obstruction and a 6px visual-only center reticle.

## Controls

Click the game canvas to capture the pointer; press **Esc** to release; **L** toggles pointer lock; right-mouse drag orbits as fallback. **WASD** moves relative to camera, **Shift** sprints, **C** crouches, **Space** jumps, **Alt** dodges, **Q** blocks visually, **F** strikes, **E** collects the relic after victory, **R** restarts, **V** recenters orbit and the **wheel** zooms. F strikes the rival at short range when facing it; Q reduces incoming damage, and E claims the relic after victory. R restarts the encounter. Combat is an early distance-based prototype, not collision-based hit detection or advanced enemy AI.

## Setup and verification

Requires **Node.js 22** (the GitHub deploy runner uses Node 22), Git and a browser capable of WebGL.

The engine is pinned to `LuminaryLabs-Dev/NexusEngine@c674a53e054640f5acc035180a2f3fe1d7d4fe03`. That revision contains a duplicate Authoring manifest entry; the existing deploy job applies a **temporary local checkout compatibility workaround**, without changing Core. A plain unpatched `npm install` may therefore fail until that pin's issue is fixed upstream. Use the pinned checkout and same temporary manifest remediation as `.github/workflows/deploy.yml` for reproducible local testing. This is technical debt, not a clean-install guarantee.

```sh
npm run check
npm run build
npm run preview
```

For *actual* 3D browser capture on a WebGL-capable machine, install Chromium and run the existing Luminary-compatible recording script:

```sh
npx playwright install chromium
npm run verify:browser
```

The browser verifier captures the real running build at `http://127.0.0.1:4173/`, saves raw WebM and stills, then encodes a 60-second MP4 using `ffmpeg`/`ffprobe` (install both). A passing Node suite/build is **not** evidence of rendered visual quality, native Escape behavior or a complete match.

## Status and ownership

Read [`docs/ROJ-0011-CUTOVER.md`](docs/ROJ-0011-CUTOVER.md) for the truth matrix, verification limits and remaining acceptance gates. Older ROJ status documents preserve historical snapshots and are not the current source of runtime behavior.

- [Game repository](https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim)
- [Live Pages preview](https://luminarylabs-publish.github.io/Relics-of-Jotunheim/)
- [Task tracker](https://docs.google.com/spreadsheets/d/1T-XUfn5WbRJmhLeg5fzbufkMC5ucnVanFigj7vJFLIo/edit)
- [Development Capture & Publishing Guide](https://docs.google.com/document/d/1_VPgdUR1BQQA_UFzIKPI75625U6eFUkNV5SEBGNqipU/edit)

No public gameplay launch or production release is claimed by this development cutover.

## ROJ-0006 hotfix: Pass 43 visual regression

The reported live-game screenshot after Pass 43 showed a torso-only/jagged character. The skin's neutral inverse bind pose matches the source numerically, but that alone is not WebGL approval. The right-shoulder collision solver could also pull the camera to 0.8 world units, producing a dangerously close camera that clips the character. This hotfix restores previously visible Pass 32 by default, constrains collision camera pull-in to the normal 3.4-unit minimum, and preserves Pass 43 as an explicitly requested experimental comparison with `?fighter=pass43`. Both prior GLBs remain unchanged. See `docs/ROJ-0006-PASS44-HOTFIX.md`.

## ROJ-0006 Pass 45 anatomy feedback build

Pass 45 changes materials, hip contours, fitted underwear and low-relief chest details on the **Pass 32 skeleton**, without reintroducing Pass 43's additional knee/elbow controls. GLB structural tests and 49 CPU-skinned animation samples pass; real Three.js WebGL validation and final anatomical approval are still pending. The game falls back to Pass 32 then v2 if Pass 45 fails to load or lacks its expected rig/clips. See `docs/ROJ-0006-PASS45-STATUS.md`.

## ROJ combat slice (November 9, 2026)

A single chasing rival now supports health, timed proximity attacks, player directional strikes, cooldowns, blocking, victory/defeat and a post-victory relic claim. Core movement and camera files were intentionally left unchanged. Combat rules live in `src/gameplay/combat-state.js` with independent tests in `tests/combat-state.test.mjs`. This is a playable prototype, **not** an approved production combat system: attacks are distance/direction checks rather than skeletal hitboxes, enemy locomotion is a simple pursuer, and visual inspection in an actual WebGL runtime is required.

**Visual debt remains:** Pass 45's distorted face, thin neck, limb joints, hands and feet shown in the November 9 screenshot were not remodelled by this combat milestone. A rig-preserving model/weight repair and GPU animation capture are still mandatory before marking ROJ-0006 complete.
