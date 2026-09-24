# Ribbit's Big Adventure — Overhaul Notes

## Product direction

The strongest direction for RBA is a **moonlit storybook arcade**: keep the expressive frog, saturated swamp palette, responsive movement, and generous game feel. The 2D campaign is the product. The visual overhaul should improve its sprites, tiles, backgrounds, animation, effects, and presentation without changing the game into 3D.

The Godot project is currently a movement prototype and should remain labelled that way until it shares level data, mechanics, progression, and tests with the web game.

## Phase 1 — completed

- Fixed the boss meteor state-machine soft lock.
- Restored collision tracking for dynamically spawned boss shockwaves.
- Disabled the invisible tongue hitbox while the tongue is idle.
- Wired `W` into jump input as documented.
- Fixed query-selected stage progression and clamped invalid stage indexes.
- Corrected carried-firefly HUD rendering and cumulative save over-counting.
- Added pause/resume with `P`, `Escape`, tap-to-resume, and automatic pause when the tab is hidden.
- Reworked the 2D browser shell for narrow screens, safe areas, focus visibility, and clearer control hierarchy.
- Increased touch targets and stopped touch controls from appearing solely because a desktop window is narrow.
- Replaced the platform-specific, failure-suppressing build command with a cross-platform build script.
- Restricted the local server to generated public assets; repository and dotfiles are no longer web-accessible.
- Added JavaScript/gameplay checks, server smoke tests, and deterministic simulator unit tests.
- Corrected the simulator so clear rate and flawless-run rate are separate metrics.

## Phase 2 — shared contracts and canonical data

- Moved all five web levels into `src/web/data/levels.json` with a companion JSON Schema.
- Added build-time level validation for dimensions, geometry, spawn/goal points, hazards, collectibles, and enemy placements.
- Made the Phaser runtime and Python level auditor consume the same canonical level file; the auditor no longer parses JavaScript with regular expressions.
- Centralized movement constants in `src/web/data/physics.json` for both runtime and offline reachability analysis.
- Added versioned profile/run save data with safe migration for legacy, malformed, partial, and future-version records.
- Added deterministic JEV fallback behavior so offline validation never requires API credentials.
- Added save migration smoke coverage and canonical-data validation to `npm test`.

## Phase 3 — campaign flow and progression

- Replaced the title-screen start shortcut with Continue, New Adventure, Stage Map, and Settings actions.
- Continue resumes the saved stage/run state; New Adventure clears progression after an explicit action.
- Stage progress and run totals are written atomically when a stage begins or clears.
- Kept direct stage buttons available only with `?dev=1` for development and QA.
- Added regression checks for the campaign menu and development-only stage controls.
- Made the stage map selectable for unlocked stages and visibly disabled for locked stages.
- Added an accessible live region for level starts, pauses, health changes, and collectibles.

## Phase 4 — responsive UI and settings slice

- Persisted mute and reduced-motion settings through the versioned save profile.
- Restored the mute state when the audio engine starts and reflected it in the HUD control.
- Reduced large HUD banner motion when the preference is enabled.
- Added persistent reduced-flashing, screen-shake, touch-opacity, and CRT preferences.
- Added a portrait guidance hint, keyboard-visible focus styling, and a live accessibility status region.
- Routed camera shake/flash effects through the accessibility settings gate.
- Added a portrait mobile E2E check for focusability, guidance visibility, and horizontal-overflow prevention.

## Phase 5 — gameplay reliability and onboarding slice

- Added a Level 1 teaching sequence for movement, jumping, tongue use, water crossings, enemy awareness, and the optional high route.
- Persisted `level1Complete` so mastered prompts stay out of later runs until a New Adventure is chosen.
- Routed gameplay camera shake/flash behavior through the same accessibility gates used by the HUD.
- Added static onboarding regression guards and verified clean browser startup after the tutorial integration.
- Fixed King Croaker completion: the victory lotus now spawns at the defeated boss instead of a hard-coded arena coordinate, and the post-defeat reward path no longer stalls on the score popup.
- Sequenced the level-4 gate, camera bounds, boss HUD, and boss activation so the arena transition reads as one intentional encounter intro.

## Phase 2 — campaign and onboarding

1. Replace the persistent stage toolbar with a title flow: **Continue**, **New Adventure**, **Stage Map**, and **Settings**. Keep direct stage jumps behind a development query flag.
2. Make `unlockedStage` meaningful in the stage map and add an explicit reset/new-adventure confirmation.
3. Add a short safe tutorial sequence to level 1: movement, one guided jump, tongue a firefly, then introduce water and the first enemy.
4. Show per-stage collectible totals and a compact objective line in the HUD.
5. Add restart-stage, reduced-motion/flash, audio persistence, and input-remapping settings.

## Phase 3 — architecture and content pipeline

1. Move authored level data from JavaScript object literals into canonical JSON validated by a schema.
2. Share movement constants between runtime and offline level analysis.
3. Split the large global scripts into modules for scenes, player/input, combat, persistence, level loading, UI, and audio.
4. Keep Phaser pinned through the package manager and remove obsolete browser-vendor mirrors.
5. Add browser gameplay tests for title-to-level startup, pause/resume, tongue activation, death/retry, level progression, and the full boss attack cycle.
6. Make AI-assisted level scoring optional; deterministic physics and schema validation should remain the required offline gate.

## Known follow-ups

- `src/web/` now owns the web client and Vite generates ignored `dist/`. The old root, `public/`, and `web/` client mirrors remain tracked for a separately approved deletion; they are no longer synchronized or deployed.
- The current stage-selection strip remains useful for development but bypasses campaign progression.
- The next visual pass needs an art bible, asset-size conventions, animation lists, and an atlas-loading pipeline before replacing placeholders.
- The Godot prototype uses different movement constants and has no campaign, combat, persistence, or level-loader parity yet.
