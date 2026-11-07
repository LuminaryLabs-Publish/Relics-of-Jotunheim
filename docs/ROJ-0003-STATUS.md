# ROJ-0003 — Phase 1 Native Authoring evidence

Status: **In Progress**. Phase 1 native asset production and six-clip structural/deformation/export/reimport validation completed; production gameplay integration and 60-second gameplay recording are NOT completed.

## Actual source-of-truth and output

- Game repository: https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim
- Engine source pinned at `c674a53e054640f5acc035180a2f3fe1d7d4fe03`.
- Reproducible Authoring script: `scripts/author-fighter-walk.mjs` (single walk default, six clips via `--all`).
- GitHub Actions workflow: `.github/workflows/roj-0003-authoring.yml`.
- Successful six-clip run: https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim/actions/runs/42340986451
- Validated asset publication run: https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim/actions/runs/42341120099
- Asset commit on `main`: `42976556dae76cc646d0cc1c904e02de9bef0853`.

Native assets committed:
- `assets/glb/fighter-rigged-prototype.glb` — 146,460 bytes, SHA-256 `3a6ab434c82f1bcf0c1a7eb42e238a8ba4d7d986edc0cc317d3ebc04b9caac1f`.
- `assets/source/fighter/canonical-source.json` — editable mesh, rig, skin, animation and assembly documents.
- `evidence/roj-0003/native-authoring-receipt.json` — operation and native validation receipt.

## Native validation achieved

- 248 editable source mesh vertices; 452 exported triangles.
- One authored rig: 14 bones; skinned through actual `n:authoring:skin`.
- Six actual glTF animation clips: Walk, Idle, Run, Jump, Land, Dodge.
- Skin deformation measured against sampled rig animation poses. All six clips showed nonzero deformation and exact start/end closure in authored double-precision source.
- `authoringExport.export(format='glb')` completed with 0 native validation errors.
- `authoringImport.import(format='glb')` into a fresh NexusEngine Authoring project succeeded; imported project validation reported 0 errors.
- Source-based preview inspection in the ChatGPT sandbox confirmed six visually distinguishable poses, though this is not equivalent to in-game animation blend, Android/Quest testing or external glTF compliance testing.
- The exporter reports a warning: `IMPORTED_NORMALS_REEVALUATED` on native reimport. This must not be represented as zero warnings.
- The four Design/Art/Interaction/Craft Kits were installed, their operation catalogues discovered and structural preflight plans generated. This **does not** establish a fully autonomous four-harness production loop or interaction scenario validation; native Project operations authored the content.

## Engine source compatibility caveat

The pinned NexusEngine commit contains duplicate Authoring Design/Art/Interaction/Craft public subpaths in `src/core-domains/authoring/domain.manifest.js`, causing `createEngine` imports to fail. The GitHub Actions workflow removes the duplicate publicEntries aliases **inside the transient checkout only** before executing Authoring operations. The engine repository has not been modified. The workaround is recorded explicitly in the workflow and is not evidence of a clean unpatched engine package. Another initial native roundtrip obstacle was addressed by using exact representable skeleton rest transforms in the asset source, leaving engine validation rules unchanged.

## Visual and integration limitations

The current humanoid is a blocky low-poly mannequin, suitable for proving a pipeline but not a finished hero. Jump and Land look like in-place anticipation/recovery because vertical translation remains gameplay/physics responsibility. Walking and running need foot-contact and transition tuning to reduce foot sliding. All six clips are **asset animation prototypes** and have not yet been bound to gameplay state or a NexusEngine Actor, nor tested with the actual third-person camera.

The production `src/main.js` remains the ROJ-0001 smoke scene and no actual NexusEngine-backed ROJ-0003 gameplay recording exists. ROJ-0002 Actor and gameplay integration remains a prerequisite.

## Remaining outcome-based tasks

1. Integrate the validated GLB in the game using actual Character/Player/Creature bindings after completing ROJ-0002.
2. Bind existing Motion/Input/Physics owners to animation selection; validate acceleration, sprint, jump, land, dodge and restart.
3. Inspect real production browser runtime, adjust rig weights and clip readability, and rerun regressions.
4. Capture and review 60 seconds of **authentic game play** from the verified production build. Do not substitute a rendered animation asset preview.
5. Mark ROJ-0003 Verified only after gameplay and media acceptance pass. Do not publish without separate approval.

Previous partial work remains in `experiments/roj-0003/`. This document supersedes its older engine-acquisition blocker for Phase 1 only; it does not mark Phase 2 or Phase 3 finished.
