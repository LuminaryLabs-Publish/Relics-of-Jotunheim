# ROJ-0003 — Partial implementation, not production-ready

The isolated movement prototype in `experiments/roj-0003/` implements camera-relative walk/sprint, acceleration/braking, jump/gravity/landing, dodge cooldown, and animation state selection. Seven deterministic Node tests passed in the sandbox.

**Not integrated:** The current game uses a separate ROJ-0001 Three.js host and ROJ-0002 remains blocked on real NexusEngine integration. This experiment must not be described as a NexusEngine Motion/Physics Kit.

**Not authored:** No NexusEngine-authored skinned GLB or six skeletal animation clips exist. The authoring runtime was unavailable because sandbox Git DNS resolution failed.

**Not recorded:** No authentic ROJ-0003 gameplay video has been made, because the required rigged NexusEngine-backed build is not running. ROJ-0002's earlier recording is not ROJ-0003 proof.

Next: acquire pinned NexusEngine/Editor sources, discover actual n:authoring rig/skin/animation/export operations, author and validate the GLB, bind movement to authoritative actor/physics state, run a browser playtest, then record a 60-second gameplay session. Do not mark ROJ-0003 Verified.
