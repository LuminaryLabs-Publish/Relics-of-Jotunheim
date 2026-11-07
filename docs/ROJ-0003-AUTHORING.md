# ROJ-0003 native walk authoring gate

This folder contains a source-pinned executable proof for the real NexusEngine `n:authoring` Domain.

**Repository:** `LuminaryLabs-Publish/Relics-of-Jotunheim`.

**Target:** real rigged low-poly humanoid + one walk clip + native skin deformation + native GLB export/reimport. It is deliberately not the six-clip production character or a gameplay video.

**Engine pin:** `LuminaryLabs-Dev/NexusEngine@c674a53e054640f5acc035180a2f3fe1d7d4fe03`.

**Procedure:** GitHub Actions workflow `.github/workflows/roj-0003-authoring.yml` acquires the pinned public NexusEngine source on the runner and executes `scripts/author-fighter-walk.mjs`. The script calls actual Authoring Project operations: `mesh.create`, `rig.set`, `skin.bind`, `skin.weights`, `animation.set`, `material.set`, `assembly.set`; uses `authoringAnimation.sample` and `authoringSkin.evaluate`; exports via `authoringExport.export` and imports with `authoringImport.import`.

**Proof artifacts:** `fighter-walk-proof.glb`, `canonical-source.json`, `native-receipt.json` are uploaded as a GitHub Actions artifact only after the native checks pass. Neither the workflow nor this document declares the gate passed beforehand.

**Subsequent gate:** visual inspection of deformed mesh and rig alignment, then five more clips, actual game Actor integration, a production browser playtest, and an authentic 60-second recording. Do not mark ROJ-0003 Verified until all pass. No engine repository writes.
