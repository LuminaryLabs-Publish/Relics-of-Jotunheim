# ROJ-0006 Pass 44 — Visual regression hotfix

## User-reported outcome
The Pass 43 game screenshot showed a large floating torso, with forearms and legs absent from the visible frame and jagged silhouette edges. This is a **real visual regression** and overrides the previous claim that Pass 43 was gameplay-approved.

## Source findings
- Pass 43: glTF 2.0, 18 skin joints, 16 clips; neutral bind matrices all match rest-world transforms with sub-micrometer numerical tolerance. CPU animation previews show the full body but do not prove actual Three.js WebGL behavior.
- The runtime camera's collision clamp permitted a camera distance of **0.8** despite a normal minimum zoom of **3.4**. That can frame a torso-only close-up or intersect the fighter. The screenshot alone cannot conclusively assign all missing geometry to rigging versus camera clipping.
- A GPU-capable Three.js visual playtest is still required to establish whether the Pass 43 joint hierarchy/weights/animation transforms require repair.

## Implemented hotfix
1. Restore Pass 32 as the **default** live fighter. Retain v2 as the automatic backup.
2. Keep Pass 43 bundled, but only select it after explicit `?fighter=pass43` query; failed opt-in loads return to Pass 32 and then v2.
3. Keep NexusEngine Creature descriptor synchronized to whichever GLB actually loads.
4. Clamp both desired camera distance and obstruction recovery to the **3.4-unit safety minimum**. This prioritizes keeping the fighter visible over clipping inside nearby arena scenery.
5. Add tests for default asset order, all 16 clips, existing Pass 43 structural properties and minimum camera distance.

## Remaining acceptance
Verify actual WebGL full-body presentation in default idle, walk/run, crouch, jump/dodge and all 16 animations from four angles; repeat with Pass 43 opt-in to identify whether a mesh/animation repair is needed. Record an authentic 60-second gameplay capture with the Luminary Development Capture & Publishing Guide. Do not promote experimental Pass 43 or mark anatomical acceptance complete without real rendered evidence. No NexusEngine Core, GLB binaries or GitHub Actions modification in this hotfix.
