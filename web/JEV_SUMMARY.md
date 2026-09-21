# What We Used JEV For: Game & Level Intelligence

**Project:** *Ribbit's Big Adventure* (Retro Platformer Game)  
**Role of JEV:** Autonomous Level Designer & AI QA Playtester  

---

### 1. Automated "Monte Carlo" QA Playtesting
Instead of manually jumping through levels for hours to find bugs, we used **JEV** to run **150 automated simulation runs per level** across all 5 stages (750+ total playthroughs).
- It simulated the frog’s exact physics (gravity, velocities, jump arc timings, and momentum).
- It tested every platform, lilypad, and bounce mushroom to ensure jump distances were humanly possible.

---

### 2. Hunting Down "Rage-Quit" Traps & Choke Points
JEV acted like an unforgiving QA tester, identifying spots where players would get unfairly punished:
- **Level 2 (Cattail Canopy):** Caught a brutal descent gap where **68% of simulated runs plunged into the water**.
- **Level 3 (Mushroom Mire):** Flagged an impossible 300-pixel vertical climb that no player could reach without a stepping ledge.
- **Level 4 (The Sunken Citadel):** Flagged ruin pillars that were too narrow or spaced just slightly outside maximum leap range.

Once we adjusted the platforms and added intermediate stepping mushrooms, JEV re-ran the full simulation suite until all levels passed with **0 unfair jumps flagged** (100% kinematic pass rate).

---

### 3. Procedural Level Design (Level 5: *Firefly Marsh*)
We used JEV to procedurally lay out and balance **Level 5 (*Firefly Marsh*)** from scratch:
- It algorithmically placed platforms, glowing fireflies, hazards, and bounce mushrooms according to kinematic jump curves.
- It ensured rhythmic pacing—balancing tight precision leaps with rewarding recovery platforms.

---

### 4. Telemetry & Heatmap Visualizations
JEV exported real-time playtest telemetry and failure heatmaps directly into our web dashboard (**Nova Mission Control**):
- Visualized jump trajectory arcs and death cluster points.
- Produced completion rate stats and difficulty distribution curves for each stage.

---

### In Short
JEV gave us an automated robot game tester that mathematically verified our game was challenging, fun, and 100% fair before handing it to real players.
