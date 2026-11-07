# Relics of Jotunheim

NexusEngine game project. First scenario: **Hymir's Pursuit**.

## ROJ-0001 — initialization

This scaffold uses NexusEngine for the runtime lifecycle and the browser Three.js host for a **temporary visual smoke scene**. The visible ground, capsule and camera are not authored production assets, and no combat, collision, Quest, network or relic gameplay is implemented.

## Start

Requires Node.js 20+ and Git.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. A grey ground plane and a placeholder fighter should be visible. Use WASD to move the *visual placeholder*; this is not the authoritative character simulation.

```sh
npm run check
npm run build
```

`check` runs source and configuration smoke checks; `build` bundles the web host. A successful build is **not** Quest/Android XR validation.

## Ownership

- **NexusEngine Core**: lifecycle and universal engine contracts, installed from the pinned upstream commit.
- **Browser host**: Three.js viewport, browser input and rendering; this is an adapter, not a new Core domain.
- **Game**: scenario definition and game-specific composition. Future domain/service/kit work must use real NexusEngine manifests rather than inventing engine registrations.

## Canonical records

- [GitHub repository](https://github.com/LuminaryLabs-Publish/Relics-of-Jotunheim)
- [Existing Drive workspace](https://drive.google.com/drive/folders/1stHZcwuENEC-A18Udu0ee6WQzJT26PM8)
- [Existing task tracker](https://docs.google.com/spreadsheets/d/1T-XUfn5WbRJmhLeg5fzbufkMC5ucnVanFigj7vJFLIo/edit)

## Status

ROJ-0001 source scaffold committed; clean dependency install, browser render, build, and hardware execution require independent validation. No public release authorized.
