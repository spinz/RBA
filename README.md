# Ribbit's Big Adventure (RBA)

![Ribbit's Big Adventure Banner](docs/images/rba_banner.png)

A 2D browser platformer starring Ribbit the frog, with a five-stage Phaser campaign,
procedural art/audio, and optional offline level-analysis tools.

---

## Overview

Ribbit's Big Adventure follows Ribbit across vibrant swamp ecosystems, treacherous canopies, glowing fungal groves, and ancient sunken ruins. The game combines classic 16-bit momentum-based platforming mechanics with procedural level balancing and variable jump physics.

The project currently has one complete game and one prototype:
1. **Web Edition (`src/web/`)**: The primary playable game, featuring the 2D Phaser campaign.
2. **Godot 4 Prototype (`godot/`)**: A native movement prototype used to explore desktop rendering and controller feel. It is not yet feature-equivalent with the web campaign.

`src/web/` is the only authored web client source. Vite builds it into ignored
`dist/` output. The old root, `public/`, and `web/` client mirrors remain
tracked until a separate reviewed cleanup; they are not build inputs. Do not
edit them. The Python level-intelligence tools under `web/tools/` remain active.

---

## World & Level Stages

- **Level 1: Lilypad Lagoon**: Introduction to variable-height leap mechanics, floating foliage, and water hazards.
- **Level 2: Cattail Canopy**: Vertical platforming with swaying stalks, descending reed drops, and momentum management.
- **Level 3: Mushroom Mire**: Fungal trampolines, bounce pads, and tight platforming leaps.
- **Level 4: The Sunken Citadel**: Crumbling stone columns, darting underwater predators, and boss arena encounters.
- **Level 5: Firefly Marsh**: Algorithmically synthesized night marsh illuminated by drifting firefly swarms and bioluminescent flora.

---

## Core Gameplay Mechanics & Controls

### Mechanics
- **Variable Jump Height**: Tap for quick hops or hold for maximum leap arcs.
- **Coyote Time & Jump Buffering**: Generous input forgiveness when running off ledge edges and queuing landing jumps.
- **Squash & Stretch**: Procedural sprite deformation responsive to velocity changes and impact landings.
- **Momentum Bouncing**: Enhanced vertical launch velocity off fungal springs and bouncy lilypads.
- **Tongue Attack**: Directional tongue strike to snare fireflies and neutralize swamp pests.

### Controls
- **Move Left / Right**: `A` / `D` or `Left` / `Right Arrow`
- **Jump**: `Space` / `W` / `Up Arrow` (hold to leap higher)
- **2D Web Tongue Attack**: `X` / `Shift`
- **Godot Prototype Attack**: `J` / `X` / `Enter`
- **Pause (2D Web)**: `P` / `Escape`
- **Restart stage (2D Web)**: `R` or the Retry button (also works while paused)

New Adventure resets the active run while keeping records, unlocked stages and
settings. Continue resumes the saved stage checkpoint, or the ending for a
completed run. Death and retry restore the stage-start score and fireflies.
Settings and the stage map support keyboard and touch. Audio starts after a user
gesture; mute, pause and backgrounding preserve the intended soundtrack.

---

## Autonomous Level Intelligence (JEV)

Levels in Ribbit's Big Adventure are verified by an autonomous AI game design and QA framework located in `web/tools/level_intelligence`:
- **Kinematic Jump Modeling**: Estimates candidate jump reachability from shared movement constants. This heuristic does not replace collision-aware route testing or human playtests.
- **Monte Carlo Playtesting**: Runs hundreds of automated playthroughs per level to surface rage-quit gaps, unfair vertical ascents, or blind falls.
- **Procedural Generation**: Algorithmically generates balanced level stages based on cadence, recovery ledges, and difficulty curves.

---

## Art Pipeline & Graphical Overhaul Roadmap

The shipped game currently uses procedural 2D art. The production-asset pass is
still planned and should preserve the existing collision geometry and timing:

- **Sprite Sheets**: High-detail 48x48 and 64x64 multi-frame animation sheets for Ribbit (idle, throat puff, leap, apex tuck, land, dive, tongue lash).
- **Environment Tilesets**: Distinct thematic tilesets for mossy mud banks, hollowed cypress logs, bioluminescent fungi, and moss-draped masonry.
- **Multi-Layer Parallax Backgrounds**: Multi-plane atmospheric backdrops featuring distant canopy silhouettes, drifting swamp mist, and glowing firefly particles.
- **Boss Entities**: Multi-phase swamp leviathan and boss monster sprites with directional telegraph animations.

An art bible, asset manifest, atlas validation, and provenance records are required
before these replacements can be marked complete.

---

## Project Structure

```
RBA/
├── godot/                      # Godot 4 Native Desktop Engine
│   ├── assets/
│   │   ├── sprites/            # Pixel art sprite textures
│   │   ├── audio/              # Sound effects and music
│   │   └── fonts/              # Retro typography
│   ├── scenes/
│   │   ├── main.tscn           # Main gameplay scene
│   │   ├── player.tscn         # Ribbit CharacterBody2D entity
│   │   └── level5_data.json    # AI-generated level layout
│   ├── scripts/
│   │   └── player.gd           # Kinematic character controller
│   ├── project.godot           # Godot project configuration
│   └── run.sh                  # One-click launcher script
│
├── src/web/                    # Canonical 2D HTML, JS, and static assets
├── dist/                       # Ignored Vite production build
├── public/                     # Historical tracked client mirror
├── web/                        # Historical client mirror + level intelligence tools
├── tools/                      # Verification scripts and Vite compatibility wrapper
├── server.js                   # Local server restricted to dist/
├── .gitignore                  # Git ignore rules
└── README.md                   # Repository documentation
```

---

## Quick Start Guide

### Playing Online (Vercel Deployment)
The Web Edition is pre-configured with `vercel.json` for zero-configuration 1-click hosting on Vercel:
1. Import `github.com/spinz/RBA` into your Vercel account.
2. Deployment is fully automatic at the root URL (`/`) with mobile touch controls and a CRT toggle.
3. Open the generated Vercel URL on mobile, tablet, or desktop to play anywhere without setup.

### Running the Web Edition Locally
Node.js 22 is required. From the repository root, install the locked packages
and start the Vite development server:

```bash
npm ci
npm run dev
```

For the production build and local production server:

```bash
npm start
```

Open your browser:

- Development: `http://127.0.0.1:5173/`
- Production: `http://127.0.0.1:3050/`

### Verification

Run the project checks before committing:

```bash
npm run build
npm run lint
npm run format:check
npm run typecheck
npm test
python -m unittest discover -s web/tools/level_intelligence -p "test_*.py"
npx playwright install chromium
npm run test:e2e
```

The browser test runs against `dist/`. All required validation runs without AI
credentials. See [CONTRIBUTING.md](CONTRIBUTING.md) for source ownership and
the current scope of JavaScript type checking.

See [the project review](docs/PROJECT_REVIEW.md) for the reproduced boss-crash fix,
campaign/audio regression coverage, screenshot checks, and honest roadmap status.

### Running the Godot 4 Edition
Requirements: Godot 4.x installed on your system.

1. Launch directly from terminal:
   ```bash
   ./godot/run.sh
   # or:
   godot --path godot
   ```
2. To open in the Godot Editor:
   ```bash
   ./godot/run.sh editor
   # or:
   godot -e --path godot
   ```

---

## License

All rights reserved. Ribbit's Big Adventure (RBA) proprietary assets and game logic.
