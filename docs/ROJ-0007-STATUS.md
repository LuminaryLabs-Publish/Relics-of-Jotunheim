# ROJ-0007 — Third-person movement and camera overhaul

## Target and source ownership

Project: Relics of Jotunheim; repo `LuminaryLabs-Publish/Relics-of-Jotunheim`.
The reviewed baseline was `c4992275ddb8ac4c4d44ea7fc84c5b6182c4acdf`.
The task is one canonical outcome in the Google Drive task tracker.

### Implementation (sandbox)

- Camera-relative WASD intent uses orbit yaw; all eight directions are normalized.
- Right-mouse drag controls an independent yaw/pitch orbit; wheel zoom, V recenter, and camera obstruction raycasting.
- Turn heading follows the shortest angular path with capped angular speed, including 180-degree reversals.
- Ground acceleration and braking apply vector rather than per-axis caps. Dodge locks the initial camera-relative direction and jump keeps airborne steering.
- Idle/walk/run/sprint, crouch, attack, block, jump, dodge and landing selections retain existing action contracts. Directional strafing/backward clips remain in the GLB but are not automatically selected during free movement (because the character faces the movement direction).
- Active ROJ-0006 Pass 32 GLB and v2 fallback preserved in the game loader.
- Keyboard focus loss, pointer release and tab visibility changes clear held inputs. Reset preserves orbit preferences while clearing movement.
- Existing NexusEngine Actor/Creature/Player composition remains untouched. This task is **not** proof that native Motion or World Contact is active; ROJ-0005 remains the integration authority. Authoring Mesh/Rig/Skin/Animation harnesses are not invoked because this change does not create or alter any authored asset.

### Validation executed

- `node --test tests/third-person.test.mjs`: 30 tests passed; compass yaw, diagonals, turning, sprint, braking, dodge, jump, camera clamp/zoom/follow and 30/60/120Hz movement comparison.
- `node --check` on all changed JS modules: passed.
- Isolated Chromium Canvas2D controller harness, using the actual movement and camera modules, passed keyboard input, right-mouse orbit, camera-relative forward travel, resize, blur and no `pageerror`; see `evidence/browser-harness-results.json` and screenshot.
- The **actual three.js + NexusEngine production game was not rendered inside this isolated sandbox**, because its pinned npm dependencies were not locally available. A successful GitHub build/deploy must not be described as a substitute for gameplay inspection. The 60-second real gameplay video and independent in-game animation/occlusion review are still required before ROJ-0007 can be marked Verified.

### Release gate

A push to main is authorized by the user, but must be described as a **testable feedback build** until browser gameplay and recording are completed. Preserve the active fighter and all unrelated files. Never change GitHub Actions.
