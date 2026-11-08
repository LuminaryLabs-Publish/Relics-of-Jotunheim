# ROJ-0008 — Player facing and independent free-look

## Scope and source
- Source baseline: `457baeab53c43d7070d928135fc798e09bf57273` on `LuminaryLabs-Publish/Relics-of-Jotunheim/main`.
- Preserves the existing ROJ-0007 camera-relative movement and right-drag orbit. Adds `L` pointer-lock free-look; `Escape` releases it.
- Facing is driven by the actual horizontal velocity after acceleration, not an immediately changed wish vector. Idle orbit does not turn the actor. Attack and block preserve facing until recovery, independent of camera movement.
- Inspected Pass 32 GLB: root and mesh nodes have no authored yaw offset; toe geometry extends toward local -Z (z minimum -0.31 at foot height, versus positive z maximum 0.14). No speculative 180-degree rotation was added.
- Reuses the ROJ-0003 deterministic compatibility adapter, existing NexusEngine Actor/Creature/Player composition and ROJ-0007 camera controller. ROJ-0005 native Motion/World Contact remains a separate pending integration.
- No fighter mesh, new animation clips, NexusEngine Core, GitHub Actions or unrelated gameplay changes.

## Verification gates
- Run `node --test tests/third-person.test.mjs` and repository `npm run check` in a supported environment.
- Real game: verify WASD at four camera headings, independent orbit while idle/moving, free-look pointer lock and Escape release, jump/dodge, attack/block, reset/resize/blur, and 60-second actual gameplay capture.
- This is a feedback implementation; do not claim 3D visual approval or media recording without an actual WebGL browser run.
