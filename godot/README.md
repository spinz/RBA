# Ribbit's Big Adventure - Godot 4 Edition

A high-performance retro pixel platformer rebuilt in Godot 4, optimized for hardware acceleration and retro pixel rendering.

---

## Quick Start

### Play the Game
From terminal:
```bash
./run.sh
# or from repo root:
godot --path godot
```

### Open in Godot Editor
From terminal:
```bash
./run.sh editor
# or from repo root:
godot -e --path godot
```

---

## Controls
- Move Left / Right: A / D or Left / Right Arrow
- Jump: Space / W / Up Arrow (variable jump height: hold for higher leaps)
- Attack / Tongue: J / X / Enter

---

## Architecture and Project Structure
- project.godot: Configured with OpenGL Compatibility mode (gl_compatibility) and crisp Nearest pixel texture filtering (default_texture_filter=0).
- scenes/player.tscn: Ribbit CharacterBody2D with collision box and animated sprite sheet.
- scripts/player.gd: Physics controller with:
  - Variable jump height (releasing cuts velocity)
  - Coyote time (jump leeway after falling off ledges)
  - Jump buffering (queues jumps before landing)
  - Squash & stretch procedural juice
- scenes/main.tscn: Starter testing stage with mossy platforms, floating lily pad, firefly, and camera smoothing.
- assets/sprites/: Retro 16-bit pixel art textures.

