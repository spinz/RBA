# First Five: Gameplay Depth Pass

## Goal and scope

Deepen the existing 2D campaign, verify it, then expand with a two-level second
chapter and a distinct boss. This is a content/gameplay milestone, not a claim
that the older production-art or Godot roadmap is complete.

Baseline: `a7963cf` (projectile boss crash, touch and ending fixes). Preserve those
regressions. Work on `codex/first-five-depth`; do not deploy unfinished content.
The current implementation batch covers D1–D4. E1–E3 are explicitly queued behind
the first-five playtest gate, not silently enabled in this release.

## Decisions

- Retain the procedural 2D visual language and existing keyboard/touch actions.
- Croaker remains stage 4. Stage 5 becomes the readable homeward victory lap,
  with optional mastery challenges and a clear final shrine/ending.
- Keep the main route completable with base abilities. Power-ups and high routes
  are rewards, never keys required to avoid a soft lock.
- Add only two power-ups and two ordinary enemy archetypes in this batch.
- No paid assets, new services, API credentials, 3D, or save reset required.

## D1 — New mechanics in isolation

### Power-ups

1. Bubble shield absorbs one ordinary damage event, then grants a short grace
   window against overlapping hazards. Does not rescue a fall out of the world.
2. Long tongue grants 1.5× base reach for 15 seconds of active scene time.
3. Repeated pickups refresh/replace, never multiply effects. Retry, death and
   stage transitions clear temporary effects; pause freezes the duration.
4. Use distinct code-native icons, visible player feedback, readable HUD status
   and announcements. Collect by body or tongue, exactly once.

### Enemies

1. Charging beetle: patrol → visible wind-up → limited charge → recovery. Never
   charge blindly off the supporting platform or into the spawn safety zone.
2. Reed spitter: visible wind-up → catchable projectile → cooldown. Teach the
   catch-and-spit mechanic before Croaker; projectiles expire and clean up.
3. Both support existing stomp, tongue and star-power interactions. Returned
   projectiles can defeat ordinary enemies as well as damage Croaker.
4. Telegraphs remain readable with mute/reduced motion/reduced flashing enabled.

Acceptance: behavioral tests for pickup/refresh/expiry/consumption, actual enemy
collisions, projectile catch/fire, cleanup and cooldown—not only direct damage
method calls.

## D2 — Rework the first five stages

| Stage | Teaching role | Content treatment |
| --- | --- | --- |
| Lilypad Lagoon | Safe movement, jump, tongue, shield | Introduce shield before a forgiving isolated threat; optional reward route. |
| Cattail Canopy | Positioning and charge timing | Introduce charging beetle on wide ground; long-tongue reward on an optional route. |
| Mushroom Mire | Bouncing and projectile capture | Introduce reed spitter with room to observe/catch; combine with earlier movement. |
| Sunken Citadel | Mastery and Croaker | Limited combinations on approach; clearer boss tells and weakness feedback; preserve reward progression. |
| Firefly Marsh | Return journey and optional mastery | Explicit victory-lap objective, gentler required route, optional collectible challenge. |

Steps: inventory actual collision surfaces; place encounters away from blind
landings; retain forgiving main-route geometry; signpost optional rewards; record
each placement and intended route in `LEVEL_DEPTH_DESIGN.md`; validate data and
review screens at desktop, mobile landscape and portrait sizes.

Acceptance: no main route requires a temporary power-up; each new mechanic is
introduced before combinations; placements are supported by reachable surfaces;
stage transitions, checkpoints and the ending remain coherent.

## D3 — Integration and pacing

1. Load isolated mechanics modules in dependency order.
2. Build pickups/enemies from canonical level data and wire managed groups and
   collisions once per scene. Keep sprite/group argument ordering explicit.
3. Create spitball support on every stage, not only boss stages.
4. Add compact HUD power-up state and stage-specific objectives/hints without
   crowding existing mobile controls or restoring dismissed tutorials.
5. Improve Croaker attack warnings/weakness feedback without introducing a second
   boss or changing the proven defeat/reward lifecycle.
6. Explain the stage-4 → homeward stage-5 → ending sequence in game and docs.

## D4 — Release candidate gate

- Build, lint, format, type checks, save/server/schema checks, Python auditor tests.
- Preserve all 25 existing browser regressions; add mechanic/collision tests.
- Verify power-ups on touch, pause/resume, death/retry, scene transitions and reload.
- Test ordinary projectile combat and Croaker's actual finishing-hit paths.
- Check finite effects, object/collider cleanup, readable mobile screenshots.
- Record heuristic route findings separately from proven blocked routes.
- Produce a playable local candidate and honest test report. Physical Pixel 8 /
  Brave and an unassisted campaign playthrough remain user playtest gates; do not
  label those complete from emulation alone.

## E1–E3 — Second chapter (queued after D4 + playtest feedback)

1. E1: author two compact levels with distinct themes/routes using the established
   power-ups and enemies; introduce at most one additional traversal variation.
2. E2: build a boss whose core loop is positioning and projectile return rather
   than repeating Croaker's slam/sweep patterns. Specify readable warning,
   vulnerability, recovery and cleanup states before implementation.
3. E3: integrate chapter selection/unlocks, dynamically bounded saves, stage map,
   soundtrack cues and a chapter ending. Migrate completed five-stage saves
   without erasing records or forcing a replay. Run the full release gate again.

Acceptance: both levels have base-ability main routes and optional mastery paths;
the boss is mechanically distinct; completed old saves unlock the expansion;
the original five-stage ending remains meaningful. Final themes/names and boss
design are proposals in the level-design handoff, not committed product decisions.

## Parallel execution and file ownership

The batch began with three GPT-5.6 Sol / medium assignments. Weekly quota limits
stopped those runs after partial edits, so two GPT-6 Luna / low agents completed
the mechanics and level-design handoffs on the same dedicated integration branch.
Non-overlapping file ownership replaced per-agent worktrees from the older
execution-plan template. Only the integration lead commits or switches branches;
agents do not publish remotely.

| Owner | Files / responsibility |
| --- | --- |
| Power-up agent | `src/web/js/player.js`, new `powerups.js`, `tests/e2e/powerups.spec.js` |
| Combat agent | new `depth-enemies.js`, `src/web/js/enemies.js`, `tests/e2e/depth-combat.spec.js` |
| Level-design agent | `src/web/data/levels.json`, `level.schema.json`, `tools/validate-level-data.js`, `docs/LEVEL_DEPTH_DESIGN.md` |
| Integration lead | entry, level builder, game scenes, HUD, shared wiring, roadmap/README, release checks |

### Shared contracts

- Level `powerups`: `{x,y,type}` where type is `bubble_shield` or `long_tongue`.
- Level `chargingBeetles`: `{x,y,patrol?}`; `reedSpitters`: `{x,y,range?}`.
- Optional `objective`, `intro` strings; `routeHints`: `{x,y,text}` entries.
- `window.Powerups.generateTextures(scene)` and `Powerups.create(scene, data)`
  return an Arcade pickup with `onSwallowed(player)`, once-only grant and cleanup.
- Player: `giveBubbleShield()`, `giveLongTongue(durationMs=15000)`,
  `getPowerupStatus()` → `{shield:boolean, tongueSeconds:number}`.
- `window.DepthEnemies.generateTextures(scene)`; constructors
  `ChargingBeetle(scene,x,y,patrol=80)` and
  `ReedSpitter(scene,x,y,projectileGroup,range=360)`.
- Enemies expose `isDefeated`, `update(time,delta)`, `squash(player)`,
  `starDefeat()`, `onSwallowed(player)`, and `takeSpitballDamage(projectile)`.
- Reed projectiles support `onSwallowed(player)` to load a player spitball, finite
  lifetime, and explicit velocity after adding to a physics group.
- Lead creates groups/colliders, calls texture generators during Boot, loads
  modules, updates new enemies/HUD, and adapts legacy enemies to returned shots.

Agents report changes, commands/results and limitations. Any shared-contract
change must be agreed with the lead before editing outside owned files.

## Execution status

- Plan/contracts: written.
- D1–D3: implemented on `codex/first-five-depth`.
- D4 automated gate: complete locally—build and static checks pass; all 30
  Playwright tests pass with two workers, including five new depth tests.
- D4 human gate: physical Pixel 8 / Brave and an unassisted campaign playthrough
  remain pending; the branch is not deployed yet.
- E1–E3: queued; not part of the immediate playable candidate.
