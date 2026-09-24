# Phase 0 baseline record

Recorded 2026-09-24 from the approved, uncommitted stability-overhaul worktree
before the Phase 1 source migration.

## Automated baseline

- `npm run build` — passed; the old synchronizer copied root client files to
  `public/` and `web/`.
- `npm test` — passed; eight first-party syntax checks, gameplay regression
  guards, shell checks, and private-file server smoke checks.
- `python -m unittest discover -s web/tools/level_intelligence -p "test_*.py"`
  — passed, two tests.

## Manual smoke checklist

Use desktop 1440×900, landscape 844×390, and portrait 390×844. For each
viewport, open `/`; note browser console warnings and errors.

- Start the 2D game and verify a level appears.
- Move left and right, tap and hold jump, and use the tongue.
- Take damage, die, then retry.
- Pause with P/Escape and resume.
- Change stage with the current development toolbar.
- In stage 4, observe the meteor, venom, and tongue-sweep attacks through
  recovery, then defeat the boss and verify the lotus and victory flow.

This checklist was recorded, but the pre-migration baseline was not manually
played or screenshotted in each viewport. The Phase 1 production build now
passes automated browser startup without page errors. The
remaining manual gameplay and visual checks are listed above for the
integration lead.

## Post-migration integration smoke

The integration lead independently opened the production `dist/` build,
started the 2D game and confirmed level 1 rendered. No browser console warnings
or errors were reported during this smoke. The full boss playthrough and the
desktop/mobile screenshot matrix remains an open manual check.
