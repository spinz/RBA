# Project review — September 24, 2026

## Scope and confirmed findings

Reviewed the canonical web scenes, player/combat, procedural audio, HUD/settings,
save data, level construction, source/deployment boundaries, CI, offline Python
auditor, roadmap and prototype boundary. Historical client mirrors are not build
inputs. The Godot movement prototype is not the shipped campaign.

The boss failure was reproduced before editing: `Cannot read properties of
undefined (reading 'spawnVictoryLotus')`. Phaser destroys the sprite's scene
reference, so invoking a scene method after `this.destroy()` halted the game loop.
The regression now defeats Croaker through the damage path, waits for the reward,
collects it, enters stage 5, reaches Victory, reloads and continues the finished run.
Additional cases defeat him during attack windup to exercise pending callbacks.

Audio had two independent schedulers, no shared volume bus, direct output from
every effect, no pause integration, and a mute operation that discarded boss-track
intent. A single scheduler now owns a desired scene cue independently of mute,
pause and browser visibility. Tracks retain distinct melodies but share triangle
lead/sine bass, common filtering and consistent gain. Effects use a separate gain
bus and the combined signal has a compressor. Scheduled sources are tracked,
stopped and disconnected; ordinary playback removes finished sources.

## Verification and its limits

- Production browser regressions cover all stage transitions, final victory and
  reload, movement/jump/tongue, inactive tongue body, pause/audio, repeated restart,
  death/retry checkpoints, mute across scene changes, native settings/stage-map
  navigation, and desktop/touch layouts at 1440×900, 844×390 and 390×844.
- Ten simulated minutes advance Phaser timers and Arcade physics at 60 Hz through
  all three boss health phases, cycling meteor, venom and tongue attacks. This is
  a deterministic logic/physics soak, not ten minutes of rendered manual play.
- Screenshots are generated under ignored `test-results/` and inspected for HUD,
  dialog, canvas-centering and control layout. Touch gameplay buttons stay at
  least 48 CSS pixels instead of shrinking with the canvas.
- Unit/smoke checks cover save migration, checkpoint totals, preserved profile
  settings, completed-run state, server boundaries and level contracts. Python
  tests cover deterministic simulations, offline failure classification and
  geometry conventions.
- Type checking currently covers build/test configuration, not every legacy
  Phaser global. Static source-string checks alone did not catch the boss crash;
  browser behavior tests are now the relevant release gate.
- Automated tests exercise transitions by positioning the player near goals;
  they do not claim a complete human playthrough of every route or a subjective
  listening test on physical speakers/phones.

## Actual roadmap status

The previously named objective/restart “Phase 6/7” slices did not complete the
original art/audio phases. `AGENT_EXECUTION_PLAN.md` remains the roadmap.

| Area | Delivered / remaining |
| --- | --- |
| Build and deployment | Canonical Vite source, pinned Phaser, CI and private-file tests exist; legacy mirrors remain undeployed. |
| Campaign | Stage flow, checkpoints, final completion, profile-preserving replay and behavioral coverage improved. Per-stage best-score/collectible records remain future work. |
| UI/accessibility | Native dialogs, readable settings, CSS-sized touch controls, reduced-motion defaults and HUD cleanup delivered. Input remapping and a fully semantic title menu remain future work. |
| Gameplay | Boss lifecycle/attack cleanup, physics groups, retry/event cleanup and regression soak delivered. Complete ES-module extraction is still outstanding. |
| 2D production art | Existing procedural art retained. Art bible, production sprites/atlases and asset provenance are not completed by this review. |
| Audio | Lifecycle and common mix delivered. Physical-device listening and broader human playtesting remain release activities. |
| Godot | Movement prototype inspected; no campaign parity is claimed or attempted. |

## Level audit observations

An explicit offline audit of all authored transitions reports no impossible
consecutive crossings in stages 1, 4 and 5. It flags two lilypad-to-high-platform
crossings in stage 2 (202px and 292px rises), and one in stage 3 (190px rise).
The auditor sorts surfaces by x and does not search alternative paths: these are
high-route playtest leads, not proof of blocked required paths. It accounts for
runtime tile rounding and centered lilypad texture bounds. Full route-search and
collision-aware trajectory checks remain distinct from this heuristic.
