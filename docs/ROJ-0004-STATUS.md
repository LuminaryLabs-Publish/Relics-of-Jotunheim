# ROJ-0004 — Implementation and acceptance status

**Status: In Progress — partial outcome.** Do not mark ROJ-0004 complete based only on asset export or automated browser capture.

## Target outcome
One believable, fully animated third-person fighter whose knees/elbows deform naturally, whose sixteen movement/combat clips respond to gameplay, and whose movement, foot contact, combat and restart pass in-game acceptance.

## Implemented on main
- `scripts/author-fighter-walk.mjs --roj4` extends the real pinned NexusEngine Authoring pipeline with higher-resolution elbow/knee rings and gradual two-bone weights, retaining the existing 14-bone rig.
- Six ROJ-0003 clips are retained; ten additional clips authored: crouch idle, crouch walk, strafe left/right, backward walk, sprint, fall, heavy landing, block, light attack.
- `assets/glb/fighter-rigged-v2.glb` (versioned, ROJ-0003 original preserved), `assets/source/fighter/canonical-v2-source.json`, and `evidence/roj-0004/native-authoring-receipt.json`.
- Native Authoring GLB export and fresh-project import passed with 0 validation errors, 1 warning. Initial publication run: https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim/actions/runs/42341910832 .
- `scripts/author-fighter-walk.mjs` also includes bilateral elbow/knee deformation checks at 0, 45, 90, and 120 degrees. A later run passed these checks but encountered a concurrent-main update when publishing its refreshed receipt; see https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim/actions/runs/42342032194 . Preserve the previously published validated GLB.
- `src/engine.js` composes actual NexusEngine Creature, Character and Player Kits; `src/main.js` loads the rigged GLB, plays animation actions and presents a third-person playable test arena. Updated tests cover Actor possession.
- Three.js version aligned with the pinned NexusEngine peer requirement, 0.186.1.
- Browser tests/build have passed in CI. Actual browser footage was captured with Playwright and the unedited WebM source preserved in https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim/actions/runs/42342197464 , but that run failed at MP4 encoding because ffmpeg was missing. The workflow now installs ffmpeg and subsequent runs revalidate the final build.

## Important limitations / blockers
1. **Not authoritative Motion/Physics integration:** The live preview uses the ROJ-0003 experimental movement adapter; NexusEngine owns Actor identity and player possession, but Motion and Physics service ownership has not been integrated. Do not claim otherwise.
2. **Combat actions are visual only:** Block and light attack animations play, but authoritative hit, damage and defense semantics are not yet integrated. ROJ-0002 remains a prerequisite.
3. **Joint visual quality:** Native deformation and joint-angle tests do not prove anatomically natural bending or reliable foot contact. The current blocky character needs a multi-view visual quality pass and animation timing/foot placement refinements.
4. **Video evidence:** The authentic gameplay capture proves that a browser scene runs and the GLB animates. It is not proof of complete NexusEngine gameplay integration or combat correctness. Final MP4 publication depends on the successful encoder-equipped workflow run.
5. **Pinned engine compatibility:** The engine's duplicate Authoring public-entry manifest issue is corrected only in the temporary CI checkout. No changes to NexusEngine Core were pushed.

## Remaining acceptance steps
- Complete real NexusEngine-owned Motion/Input/Physics and ROJ-0002 combat integration.
- Inspect 0/45/90/max flexion from multiple views and correct unnatural bends, self-intersection and foot sliding.
- Test complete gameplay transitions, collision, hit/defense, restart, and performance in an actual browser.
- Review a verified 60-second gameplay MP4 from the final build.
- Reconcile the ROJ-0004 canonical task and evidence; do not mark Verified until all target outcomes pass.

## Source and workflow
- Game: https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim
- Authoring CI: `.github/workflows/roj-0003-authoring.yml` (now ROJ-0004 asset proof).
- Browser CI: `.github/workflows/roj-0004-browser.yml`.
- Source pin: `LuminaryLabs-Dev/NexusEngine@c674a53e054640f5acc035180a2f3fe1d7d4fe03`.
