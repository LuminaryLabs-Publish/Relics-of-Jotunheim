# Relics of Jotunheim

**Development preview** of the NexusEngine-backed third-person game. Current playable test scene: an arena with a rigged, animated fighter, one static dummy, camera-relative locomotion and a fixed visual-only center dot. The full *Hymir's Pursuit* match/scenario, hit damage, opponents, relic gameplay and Quest/Android builds are **not implemented**.

## ROJ-0011 runtime cutover

- **NexusEngine:** Creature/Character/Player registration and possession; native Action Locomotion, World Contact and Locomotion Contact Response contracts; corrected frames published to Core Motion. Two-Bone IK Kit is installed but gameplay foot planting/IK deformation is still future work.
- **Game:** `src/movement/player-motion.js` is the only production locomotion state owner. `experiments/roj-0003/movement.js` remains test/historical code, **not** part of the live game. ROJ-0005's terrain slope fixture is not live arena geometry.
- **Presentation:** Three.js renders the active **Pass 43 elbow/knee articulated GLB** (18 joints, 16 updated clips); Pass 32 is the first fallback, with v2 retained as a second fallback. The NexusEngine creature descriptor is switched to the actually loaded GLB. Additive head/neck/chest rotations follow camera look in the character's local coordinate system; movement and camera headings are independent.
- **Runtime:** a bounded 60-Hz fixed-step simulation, browser pointer lock requested synchronously from click/L, right-mouse fallback, over-right-shoulder orbit, basic camera obstruction and a 6px visual-only center reticle.

## Controls

Click the game canvas to capture the pointer; press **Esc** to release; **L** toggles pointer lock; right-mouse drag orbits as fallback. **WASD** moves relative to camera, **Shift** sprints, **C** crouches, **Space** jumps, **Alt** dodges, **Q** blocks visually, **F** attacks visually, **R** restarts, **V** recenters orbit and the **wheel** zooms. There is no damage, target lock, enemy AI or match outcome yet.

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
