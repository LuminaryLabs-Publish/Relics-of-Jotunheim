# ROJ-0009 — Pointer-locked camera and natural head look

Implementation candidate, subject to actual-game visual acceptance.

## Scope
- Click the gameplay canvas to request pointer lock from a user gesture; Escape/browser unlock and a resume prompt; retain L shortcut and right-mouse fallback.
- Use movementX/movementY while locked, with the existing clamped pitch, camera orbit, zoom, camera occlusion and camera-relative WASD unchanged.
- Add head/neck/chest look offsets in character-local space after `AnimationMixer.update()`, restoring previous evaluated poses before the next mixer update. Avoid accumulated drift or writing GLB assets.
- Attenuate look tracking during run/sprint, jump, dodge, block and attack; ease to neutral on unlock. Missing bones gracefully fall back to camera-only mode.

## Rig evidence
- Active Pass32 GLB: glTF 2.0; 18 nodes; 16 animation clips; `chest` node 7, `neck` 8, `head` 9. All have identity rest quaternions. Bone chain root/pelvis/spine/chest/neck/head.
- The chest is animated by Dodge, Crouch Idle, Strafe Left, Strafe Right, Heavy Landing, Block and Light Attack; additive restoration is mandatory. The head and neck are not targeted by the 16 clips.
- Forward axis is local -Z; the earlier A/D yaw sign correction remains intact.

## Validation evidence
- Sandbox Node tests: 47 passed, 0 failed (39 existing movement/camera tests plus 8 head-look tests).
- Head-look tests cover correct sign, clamp, combat attenuation, missing-bone fallback, additive pose preservation, drift prevention, and frame-rate convergence.
- Chromium pointer-lock test: user click acquired lock; `movementX/Y` events observed; programmatic release and click reacquisition succeeded, with no page errors. Headless Escape emulation did not release pointer lock, so native Escape behavior is not independently proven by that test.
- Real-game WebGL deformation screenshots, 60-second authentic recording and on-device gameplay acceptance are **not yet verified**. Do not mark task Done based only on these tests.

## Ownership
NexusEngine owns Actor/Creature/Player composition. The browser adapter remains ROJ-0003 until ROJ-0005 Motion/Contact integration. No NexusEngine Core, model asset, or GitHub Actions changes.
