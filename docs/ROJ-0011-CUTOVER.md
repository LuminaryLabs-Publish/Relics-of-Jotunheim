# ROJ-0011 — Source Reconciliation & Simulation Cutover

**Scope:** Development-preview stabilization, not a production release. Baseline: `ad757a472343846eb465277fca89496e1a28fe3c` (2026-11-08). No NexusEngine Core or GitHub Actions changes.

## Before / after

| Concern | Baseline | Cutover outcome | Remaining acceptance |
| --- | --- | --- | --- |
| ROJ-0001 initialization | README and index still said smoke placeholder | Current runtime/controls/docs truth updated | Reconcile missing canonical task row |
| ROJ-0002 gameplay | Static dummy, visual F/Q only | Still explicitly visual-only; no invented damage/victory | Actual combat vertical slice remains separate |
| ROJ-0003 movement | `experiments/roj-0003/movement.js` ran live | Live state now comes from NexusEngine Action Locomotion → World Contact → Response | Compare physical tuning in rendered game |
| ROJ-0004 animation | 16 authored clips available | Active GLB and 16 names retained; tests verify source GLBs | Joint/foot contact visuals still need review |
| ROJ-0005 contact | Test fixture not imported into gameplay | Native contact contract runs in live locomotion; flat arena surface used, not invisible slope | Real slope/contact/IK rig integration remains separate |
| ROJ-0006 fighter | Pass32 v3 render; registry pointed to v2 | Registry now prefers v3; fallback updates same creature descriptor | Visual anatomical approval still pending |
| ROJ-0007 movement/camera | Camera-relative WASD + old movement | Same input convention, one native corrected movement state | Real 3D regressions to review |
| ROJ-0008 body heading | A/D corrected, idle orbit independent | Facing still follows corrected velocity | Real animation direction review |
| ROJ-0009 pointer/head | Pointer lock L from RAF, head yaw sign wrong | L requested in keydown, click-lock, additive yaw aligned with camera/body | Native Esc and live neck deformation review |
| ROJ-0010 shoulder/dot | Offset/right-shoulder aim and 6px HUD dot | Preserved, with real Three.js projection tests | Actual WebGL framing/clipping review |

## Validated scope

- Native engine composition and actual pure contract imports are exercised in repository tests (when installed at the pinned engine revision).
- Motion adapter sends the contact-corrected frame back to NexusEngine Motion each tick; no second authoritative movement update remains in `src/main.js`.
- Native Action Locomotion's frame omits calculated cooldown fields; the adapter carries those fields forward into the *same* corrected simulation state (no upstream engine patch). Check upstream contract before removing this compatibility step.
- Fixed 60 Hz simulation bounds long frame debt, preserving jump/dodge input edges until a tick occurs.
- Character v3 and v2 fallback GLB names, 16 clips, animation bone hierarchy and descriptor selection have tests.
- Direct click/key event pointer lock, native Escape fallback, blur/re-entry, rendering overlay and head-look relative rotation have tests.
- A real WebGL gameplay capture, visual deformation inspection and authentic 60-second recording **must be done in a GPU/WebGL-capable runtime** before marking the full task Verified. Sandbox Chromium could not create WebGL contexts even with software flags.

## Architecture and task truth

Older ROJ-0002/0003/0004/0005/0006 status documents describe historical phases and may reference workflows absent from current tree. Do not retroactively change old receipts. `docs/ARCHITECTURE.md` and this file are current architecture truth; each older task keeps its own acceptance gate in the canonical tracker. ROJ-0001 and ROJ-0005 task rows require separate tracker reconciliation, not invented evidence.

## Repro and rollback

Source baseline `ad757a472...` is the rollback point. `npm run check` runs old and new contract tests, `npm run build` checks the web bundle, and `npm run verify:browser` captures genuine gameplay on a browser supporting WebGL. Store raw WebM, screenshots and ffprobe evidence per the [Luminary Development Capture & Publishing Guide](https://docs.google.com/document/d/1_VPgdUR1BQQA_UFzIKPI75625U6eFUkNV5SEBGNqipU/edit). A successful CI deploy is not a substitute for actual visual inspection.

## Deferred / not delivered in this cutover

No enemy AI, actual damage/hits, victory state, multiplayer, physics provider, production foot IK, full terrain, complete Hymir's Pursuit scenario, Quest hardware validation, or public release. Track these through their respective original outcomes, not through a false ROJ-0011 completion claim.
