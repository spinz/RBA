# RBA Multi-Agent Improvement Plan

This plan assumes the Phase 1 stability overhaul documented in `docs/OVERHAUL.md` is the starting baseline.

## 1. Mission and product decisions

Build Ribbit's Big Adventure into a polished, testable web campaign with a clear player journey and reliable content pipeline.

These decisions should be treated as fixed unless the project owner explicitly changes them:

1. The **2D web campaign is the primary game**.
2. The visual overhaul stays **2D** and focuses on higher-quality production assets.
3. The **Godot project remains a labelled prototype** until a later parity milestone.
4. Required validation must run offline and without AI credentials.
5. AI/JEV analysis may enhance level design, but must remain optional.
6. Every phase must leave the default branch playable.
7. Generated deployment files must never be hand-edited.

## 2. Team structure

Use one integration agent and up to five implementation agents.

| Role | Primary ownership | Must avoid editing |
|---|---|---|
| Integration lead | Roadmap, shared contracts, merges, release gates | Large feature implementation unless unassigned |
| Build agent | Package/build setup, source layout, server, CI | Gameplay behavior and level design |
| Campaign agent | Save data, title flow, stage map, scene progression | Asset production and build system |
| Gameplay agent | Player, combat, enemies, boss, onboarding triggers | Build configuration and art source files |
| UI/accessibility agent | DOM shell, HUD, settings, mobile controls, accessibility | Enemy state machines and level geometry |
| Data/testing agent | Level schema, shared constants, deterministic audit, automated tests | Visual redesign outside test fixtures |
| Art pipeline agent | Art bible, sprite specifications, atlases, asset integration | Campaign progression and gameplay rules |

If fewer agents are available, combine Campaign + UI and Gameplay + Data/Testing. Do not combine Build and feature work during the source migration.

## 3. Collaboration protocol

Every agent should follow this workflow:

1. Read `README.md`, `docs/OVERHAUL.md`, and this plan.
2. Inspect current code before proposing changes; do not assume file locations remain unchanged.
3. Work in a dedicated branch or worktree with the `codex/` prefix.
4. Declare owned files in the task description. Ask the integration lead before modifying another agent's owned file.
5. Make small commits that each leave relevant checks passing.
6. Edit the web client only in `src/web/`. `public/`, root client files, and `web/js/` are retained historical mirrors; Vite builds `dist/` without syncing them.
7. Add or update tests for every behavior change.
8. End each handoff with:
   - summary of behavior changed;
   - files changed;
   - tests run and results;
   - screenshots for visual changes;
   - known risks or follow-ups;
   - commit SHA.
9. The integration lead merges only after the phase acceptance gate passes.

## 4. Global definition of done

A task is complete only when:

- the requested behavior works in a fresh browser session;
- desktop and mobile layouts remain usable;
- keyboard and touch controls still function;
- no new console errors appear;
- relevant automated tests pass;
- documentation matches the implementation;
- generated files, if still tracked, were produced by the build rather than edited manually;
- unrelated user changes were preserved.

## 5. Phase sequence

Complete phases in order. Tasks marked **parallel** may run concurrently after their phase prerequisites are merged.

---

## Phase 0 — Freeze and characterize the baseline

**Owner:** Integration lead  
**Parallel work:** None

### Steps

1. Create an overhaul integration branch from the current approved baseline.
2. Run and record:
   - `npm run build`
   - `npm test`
   - `python -m unittest discover -s web/tools/level_intelligence -p "test_*.py"`
3. Capture baseline screenshots at approximately:
   - 1440×900 desktop;
   - 844×390 mobile landscape;
   - 390×844 mobile portrait;
   - title, level 1, pause overlay, and boss stage.
4. Record current browser console warnings and errors.
5. Write a short manual smoke checklist covering start, movement, jump, tongue, damage, death/retry, pause, stage change, boss attacks, and victory.

### Acceptance gate

- All existing automated checks pass.
- Baseline screenshots and smoke results are attached to the tracking issue.
- Any pre-existing failure is documented before feature agents begin.

---

## Phase 1 — Establish one source tree and a reproducible toolchain

**Owner:** Build agent  
**Parallel work:** None; this phase changes file locations.

### Steps

1. Create one canonical source tree:
   - `src/web/index.html`
   - `src/web/js/`
   - `src/web/assets/`
2. Configure a modern bundler such as Vite with:
   - development server;
   - production output to `dist/`;
   - a stable `/` route;
   - static asset copying;
   - source maps for first-party code.
3. Replace the committed Phaser vendor blob with a pinned package dependency.
4. Commit the package lockfile.
5. Update Vercel configuration to deploy `dist/`.
6. Update the local Node server only if it still adds value; it must serve `dist/` exclusively and stay bound to localhost by default.
7. Remove tracked mirror trees only after comparing production output and obtaining integration-lead approval.
8. Add scripts:
   - `npm run dev`
   - `npm run build`
   - `npm run lint`
   - `npm run format:check`
   - `npm run typecheck` or JavaScript checking via `checkJs`
   - `npm test`
   - `npm run test:e2e`
9. Add CI that runs build, lint, type checking, unit tests, and offline level validation.
10. Update `README.md` and contributor instructions.

### Acceptance gate

- There is exactly one hand-edited web source tree.
- A clean clone can install, build, test, and serve the game using documented commands.
- Production output is not tracked unless deployment requires it.
- The 2D game matches baseline functionality.
- Repository-private files cannot be requested from the development server.

---

## Phase 2 — Extract shared contracts and canonical level data

**Owner:** Data/testing agent  
**Parallel work:** Campaign agent may design flows, but should not implement until contracts merge.

### Steps

1. Create versioned profile and run-state schemas.
2. Separate persistent profile data from active-run data:
   - profile: version, unlocked stages, best score, best firefly count, settings, tutorial flags;
   - run: current stage, score, carried fireflies, checkpoint/start-of-stage totals.
3. Add migration logic for `rba_save_data_v1`, including corrupted or partial data.
4. Move level definitions from executable JavaScript into canonical JSON files.
5. Add a JSON Schema covering level dimensions, spawn, platforms, hazards, enemies, collectibles, goal, boss arena, and optional metadata.
6. Validate every level during build/test.
7. Extract shared gameplay constants—gravity, run speed, jump velocity, spring velocity, tongue reach, coyote time, and jump buffer—into one configuration module.
8. Update both runtime and offline physics analysis to consume the shared data.
9. Correct auditor coordinate conventions so platform and lilypad bounds match runtime geometry.
10. Keep optional AI scoring behind an adapter; missing credentials must never fail deterministic validation.
11. Add unit tests for schema failures, save migrations, physics constants, jump reachability, and deterministic simulation.

### Acceptance gate

- Runtime levels and offline analysis consume the same canonical level data.
- No regex conversion from JavaScript objects to JSON remains.
- Save migration handles empty, valid-v1, malformed, and future-version data safely.
- Offline validation runs without network access or API keys.

---

## Phase 3 — Campaign flow and progression

**Owner:** Campaign agent  
**Parallel work:** Phase 4 UI agent and Phase 5 gameplay agent may work against the merged contracts.

### Steps

1. Replace automatic title-to-level behavior with a title menu:
   - Continue;
   - New Adventure;
   - Stage Map;
   - Settings.
2. Continue should resume the highest unlocked stage or active checkpoint using explicit rules documented in code.
3. New Adventure should reset run state; resetting persistent progression requires a separate confirmation.
4. Build a stage map that shows stage name, lock state, best score, and collectible record.
5. Hide direct stage-jump controls from normal production UI. Preserve them behind `?dev=1` or a development build flag.
6. Make stage unlocks atomic with score/firefly updates.
7. Ensure death/retry restores the start-of-stage carried total rather than duplicating or erasing earlier-stage progress.
8. Ensure query-selected levels are consumed only once and do not break subsequent progression.
9. Add scene-transition guards so repeated taps or overlaps cannot complete a level twice.
10. Add unit and end-to-end tests for new game, continue, unlock, retry, completion, final victory, and save reload.

### Acceptance gate

- A new player can complete a coherent five-stage campaign without using developer controls.
- Reloading the browser preserves documented progression.
- Locked stages cannot be entered through normal UI.
- Every campaign-flow scenario has an automated test.

---

## Phase 4 — Responsive UI, accessibility, and settings

**Owner:** UI/accessibility agent  
**Parallel work:** Phase 3 and Phase 5, using shared interfaces rather than editing their internals.

### Steps

1. Define a unified visual system for the “moonlit storybook arcade” direction:
   - color tokens;
   - typography roles;
   - spacing and safe zones;
   - focus treatment;
   - danger, collectible, and success colors.
2. Use the display font only for logos and short headings; use a highly readable font for instructions and settings.
3. Replace duplicate page/game instructions with one context-aware control hint.
4. Build a responsive HUD:
   - hearts on the left;
   - current/total fireflies and objective in the center;
   - pause and audio on the right.
5. Move mobile controls to HTML overlays or otherwise guarantee 48×48 CSS-pixel targets after scaling.
6. Support safe areas, portrait layout or a clear rotate prompt, and mobile landscape.
7. Add settings for:
   - master audio/mute persistence;
   - reduced motion;
   - reduced flashing;
   - screen shake intensity/off;
   - CRT effect;
   - touch-control opacity;
   - input remapping if feasible in this phase.
8. Make every DOM control keyboard reachable with an accessible name and visible focus.
9. Add a small DOM live region for stage start, pause, health changes, collected totals, boss state, and victory.
10. Respect `prefers-reduced-motion` by default and propagate the setting into Phaser effects.
11. Remove forced pinch-zoom restrictions unless a documented gameplay blocker requires them.
12. Add screenshot tests or visual snapshots for agreed desktop and mobile sizes.

### Acceptance gate

- No horizontal overflow exists at supported viewports.
- Touch targets meet the 48×48 CSS-pixel minimum.
- The complete title/settings/stage flow is keyboard navigable.
- Reduced-motion mode disables or softens camera shake, flashing, blinking prompts, and large looping tweens.
- Browser accessibility inspection shows meaningful names for interactive DOM controls.

---

## Phase 5 — Gameplay reliability and onboarding

**Owner:** Gameplay agent  
**Parallel work:** Phases 3 and 4 after shared contracts are merged.

### Steps

1. Extract the player controller, input mapping, combat interactions, and enemy/boss logic from large scene files into focused modules.
2. Replace dynamic arrays used as physics targets with managed Phaser groups.
3. Put player spitballs in one physics group with one boss overlap handler; remove per-projectile collider accumulation.
4. Define boss states and legal transitions in one explicit state machine.
5. Add deterministic boss tests covering:
   - intro to idle;
   - meteor windup, apex, slam, stun, and recovery;
   - venom attack and cleanup;
   - tongue sweep telegraph, damage window, and recovery;
   - damage invulnerability;
   - defeat and lotus spawn.
6. Separate score mutation from popup presentation to eliminate duplicate boss-hit messages.
7. Add a level-1 teaching sequence:
   - safe movement zone;
   - guided jump;
   - tongue a clearly placed firefly;
   - cross a forgiving water gap;
   - encounter one isolated enemy;
   - introduce the optional high route.
8. Store tutorial-completion flags and suppress mastered prompts on later runs.
9. Review all levels using corrected deterministic geometry and manual playtests for novice, casual, and expert paths.
10. Add checkpoints only if full-stage retries prove too punitive in playtesting.
11. Add browser tests for movement, coyote time, jump buffering, variable jump, tongue activation, inactive hitbox, hazards, enemy damage, death/retry, and boss completion.

### Acceptance gate

- Every boss attack completes and returns to a legal state during a ten-minute automated soak test.
- No inactive hitbox can collect or damage an entity.
- Level 1 teaches core controls without requiring the title-screen instruction list.
- All five levels pass deterministic reachability validation and manual smoke testing.

---

## Phase 6 — 2D art and asset-pipeline overhaul

**Owner:** Art pipeline agent  
**Parallel work:** Asset specification may run alongside Phase 5; runtime integration begins after player and enemy interfaces stabilize.

### Steps

1. Write an art bible for the moonlit-storybook direction covering palette, value ranges, silhouette rules, outline weight, lighting, texture density, and animation timing.
2. Inventory every placeholder and procedural visual by stage and gameplay role; rank replacements by player visibility and reuse.
3. Define source and runtime specifications for each asset class:
   - Ribbit and boss animation frames;
   - enemies, collectibles, hazards, and effects;
   - terrain tiles, props, and decorative overlays;
   - multi-layer parallax backgrounds;
   - HUD icons, panels, and typography.
4. Establish consistent logical sizes, pivots, collision-reference overlays, naming, trim rules, filtering, and atlas padding.
5. Create one vertical-slice asset pack for level 1 before producing the remaining stages.
6. Import assets through a manifest-driven Phaser loader and generated atlases; keep source artwork separate from optimized runtime output.
7. Preserve collision geometry and gameplay timing while swapping art. Any deliberate gameplay-space change requires Gameplay-agent review.
8. Add reduced-motion variants for large ambient animations and effects.
9. Add fallback placeholders and validation for missing frames, duplicate keys, invalid dimensions, and oversized textures.
10. Capture comparison screenshots at the agreed desktop and mobile viewports, then iterate on readability before scaling production to stages 2–5.

### Acceptance gate

- The level-1 vertical slice is visually cohesive and readable at supported viewports.
- Every shipped asset follows the documented naming, sizing, pivot, atlas, and license/provenance rules.
- Art replacement does not change collision outcomes or input timing.
- Missing or malformed asset entries fail validation clearly instead of breaking gameplay at runtime.

---

## Phase 7 — Audio, effects, and final polish

**Owners:** UI agent + Gameplay agent  
**Parallel work:** Yes, with separate file ownership.

### Steps

1. Normalize sound levels and prevent overlapping music instances across scene changes.
2. Persist audio settings and unlock WebAudio only after a user gesture.
3. Give each stage a distinct ambience while retaining a coherent soundtrack identity.
4. Audit visual effects for clarity: reward, danger, invulnerability, boss telegraphs, and collectible feedback must be visually distinct.
5. Make all effects obey reduced-motion/reduced-flash settings.
6. Reduce center-screen obstruction from level banners and prompts.
7. Add objective/progress feedback without crowding the playfield.
8. Conduct structured playtests with at least:
   - first-time platformer player;
   - casual platformer player;
   - experienced player;
   - keyboard-only user;
   - touch user.
9. Record completion time, deaths by location, misunderstood mechanics, and settings/accessibility feedback.
10. Fix P0/P1 playtest findings and document deferred P2/P3 findings.

### Acceptance gate

- No duplicate music or runaway audio nodes after repeated scene changes.
- Important hazards and boss attacks are readable with audio muted.
- The campaign is completable with keyboard and touch controls.
- No unresolved P0 or P1 findings remain from final playtests.

---

## Phase 8 — Release gate

**Owner:** Integration lead  
**Parallel work:** None

### Steps

1. Rebase or merge the latest approved branches into the integration branch.
2. Resolve changes according to contract ownership; do not blindly accept either side of conflicts.
3. Run the full clean-install pipeline.
4. Run desktop and mobile end-to-end suites.
5. Run offline level validation and the boss soak test.
6. Complete the manual smoke checklist for the 2D campaign at every supported viewport.
7. Verify a production build through the same server/routing model used by deployment.
8. Confirm that no secrets, API keys, caches, generated debug artifacts, or private repository files are included.
9. Update README, controls, screenshots, changelog, and known limitations.
10. Tag a release candidate and have a different agent perform the final review.

### Acceptance gate

- Clean install, build, tests, and production preview all pass.
- Campaign progression works across a browser reload.
- No console errors occur in the release smoke run.
- Deployment contains only intended public assets.
- Documentation and visible controls agree.

## 6. Pull-request dependency map

Use this merge order:

```text
Phase 0 baseline
    ↓
Phase 1 source/toolchain
    ↓
Phase 2 shared contracts/data
    ├── Phase 3 campaign ─────┐
    ├── Phase 4 UI/a11y ─────┼── Phase 7 polish
    ├── Phase 5 gameplay ────┤
    └── Phase 6 2D art ──────┘
                              ↓
                        Phase 8 release
```

Phases 3–6 may proceed concurrently only after they agree on Phase 2 interfaces. The integration lead should merge small shared-interface PRs before large feature PRs.

## 7. Agent task template

Copy this into each coding-agent assignment:

```text
Objective:
Complete [phase/task] from docs/AGENT_EXECUTION_PLAN.md.

Starting point:
- Branch/commit: [exact SHA]
- Dependencies already merged: [list]

Owned files/modules:
- [paths]

Do not modify without approval:
- [paths owned by other agents]

Required behavior:
1. [behavior]
2. [behavior]

Required tests:
1. [test]
2. [test]

Acceptance criteria:
- [copied from phase]

Handoff requirements:
- Summary, changed files, commands/results, screenshots where relevant,
  risks/follow-ups, and commit SHA.
```

## 8. First recommended agent batch

After Phase 0, assign only the Build agent to Phase 1. After Phase 2 merges, start this batch in parallel:

1. Campaign agent: title flow, stage map, and persistence integration.
2. UI/accessibility agent: responsive HUD, settings shell, accessibility infrastructure.
3. Gameplay agent: module extraction, collision groups, boss tests, onboarding triggers.
4. Art pipeline agent: art bible, asset inventory/specification, and level-1 vertical slice.
5. Data/testing agent: end-to-end harness, schema fixtures, deterministic level checks, and soak-test utilities.

The integration lead should hold twice-weekly interface reviews—or their asynchronous equivalent—and merge shared contracts early instead of allowing each branch to invent its own version.
