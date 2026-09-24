# Contributing to RBA

The web game has one authored source tree: `src/web/`. Edit the
HTML, JavaScript, and static files there. The repository-root, `public/`, and
`web/` client files are tracked historical mirrors. They are retained for a
separate reviewed cleanup and are not part of the current build or deployment.
The offline level-intelligence tools remain in `web/tools/level_intelligence/`.

Use Node.js 22 and Python 3.12. From the repository root, run `npm ci`, then
`npm run dev` for the Vite development server. `npm run build` writes ignored
production output to `dist/`; `npm start` builds and serves that output on
`127.0.0.1:3050`. `/` opens the game.

Before handing off a change, run `npm run build`, `npm run lint`,
`npm run format:check`, `npm run typecheck`, `npm test`, and
`python -m unittest discover -s web/tools/level_intelligence -p "test_*.py"`.
For browser route changes, install Chromium once with `npx playwright install
chromium`, then run `npm run test:e2e`. These checks need no AI credentials.

The current game scripts publish their interfaces on `window`. The Vite entry
file loads them in dependency order and imports Phaser from a pinned package.
Keep that order until the scene modules are extracted in a later
phase. JavaScript `checkJs` currently covers new configuration code; the
existing game scripts have legacy type errors and are not yet in that gate.

Add or update a behavior test when changing gameplay or route behavior. Do
not edit `dist/` or historical client mirrors by hand. The compatibility
`tools/build-web.js` command delegates to Vite without syncing mirrors.
