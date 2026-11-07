# Domain / Service / Kit ownership — ROJ-0001

These are **game design responsibility boundaries**, not claims that matching NexusEngine manifests or APIs exist.

| Domain | Service responsibilities | Future Kit responsibilities |
| --- | --- | --- |
| World | terrain, regions, water, traversal | surfaces, collision, routes |
| Character | body, locomotion, camera, evasion | movement, focus, dodge |
| Combat | attacks, defense, hit resolution | melee, hurtboxes, recovery |
| Relic | ownership, ability, upgrade, mastery | equipment, activation, counterplay |
| Creature | giant perception/pursuit, serpent exterior/interior | sensing, locomotion, hazard |
| Match | spawning, survival, pressure, victory | elimination, results |
| Presentation | materials, visual cues, animation | lighting, VFX, telegraphs |
| Network | authoritative synchronization | transport and ownership |
| Runtime | host integration and build | web host, eventual Android XR |

Only NexusEngine's documented `createEngine()` runtime lifecycle is integrated by this scaffold. Browser rendering is performed by a Three.js **host adapter**, consistent with the engine's separation of renderer-neutral Core and external providers.

Before adding any Kit, inspect NexusEngine's actual manifests, API discovery and NexusEngine-Kits. Do not invent registration names. Reusable functionality belongs in its existing owner; game-specific compositions stay here.

## Not implemented

Physics collision, authored terrain, fighter gameplay, giant AI, serpent anatomy, relics, multiplayer, native Quest runtime, and production media.

## Pin

NexusEngine: `c674a53e054640f5acc035180a2f3fe1d7d4fe03` (main observed 2026-11-06). Install and integration must be tested independently.
