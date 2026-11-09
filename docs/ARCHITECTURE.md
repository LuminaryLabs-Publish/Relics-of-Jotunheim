# Relics of Jotunheim — Architecture after ROJ-0011

## Runtime ownership

| Owner | Responsibility | Source |
| --- | --- | --- |
| NexusEngine Actor | Creature descriptor, Character, Player possession | `src/engine.js` |
| NexusEngine Simulation / Motion | Native Action Locomotion frame and corrected Motion intent/frame | `src/movement/player-motion.js`, pinned Core |
| NexusEngine World Contact | Flat preview arena ground contact and correction | `src/movement/contact-motion.js`, `src/movement/arena-surface.js`, pinned Core |
| Game simulation adapter | Camera-relative input mapping, dodge timer, visual heading and circular arena constraint | `src/movement/player-motion.js` |
| Browser input | Pointer lock, Esc, right-drag fallback, blur/recovery | `src/runtime/pointer-look.js` |
| Frame scheduler | Bounded fixed 60 Hz gameplay tick | `src/runtime/fixed-step.js` |
| Presentation | GLB playback, additive look, camera obstruction, reticle | `src/main.js`, `src/animation/head-look.js`, `src/movement/third-person-camera.js` |
| Character registry | Canonical active v3 asset and v2 fallback descriptor switch | `src/gameplay/fighter-assets.js` |

## Single authority policy

The ROJ-0003 movement adapter in `experiments/` is not imported by the live host. Live frames flow through native `advanceActionLocomotion` → native `resolveWorldContact` → native `createLocomotionContactResponse`, with deterministic arena radius correction applied to the same frame and Core Motion receiving that final corrected frame. The world-contact Kit is installed for domain ownership; the integration uses its published **pure deterministic contract functions** to avoid maintaining a second hidden Kit state. Any native codec limitations are documented explicitly in `docs/ROJ-0011-CUTOVER.md`.

The original ROJ-0005 slope/plateau fixture remains isolated for offline tests. In the current live preview the visible arena floor is flat; no invisible slope or unsupported physics terrain is added. The Two-Bone IK Kit is installed but not yet driving feet in the actual GLB; its presence must not be labeled finished foot IK.

## Not implemented

Authoritative hits/damage/block defense, giant/serpent AI, relics, multiplayer, full scenario simulation, Quest runtime, rendered foot IK and production media. The static dummy and F/Q animations are **visual preview only**. Historical evidence docs refer to older revisions; the cutover ledger documents current status and limitations.

## Scope and reproducibility

NexusEngine stays pinned to `c674a53e054640f5acc035180a2f3fe1d7d4fe03`. The project does not modify Core, other repositories or GitHub Actions. Browser capture follows the [Luminary Development Capture & Publishing Guide](https://docs.google.com/document/d/1_VPgdUR1BQQA_UFzIKPI75625U6eFUkNV5SEBGNqipU/edit).
