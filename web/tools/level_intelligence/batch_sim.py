import json
import os
from tools.level_intelligence.auditor import LevelAuditor
from tools.level_intelligence.simulate import PlaytestSimulator

auditor = LevelAuditor()
levels = auditor.parse_js_levels("js/levels.js")

print(f"Loaded {len(levels)} levels from js/levels.js")
all_results = []

for idx, lvl in enumerate(levels):
    lvl_num = idx + 1
    name = lvl.get("name", f"Level {lvl_num}")
    print(f"\n--- [Auditing & Simulating Level {lvl_num}: {name}] ---")
    
    # Audit all crossings up to 25
    audit_report = auditor.audit_level(lvl, max_jumps_to_audit=25)
    print(f"Audited {len(audit_report['jumps'])} crossings. Avg Difficulty: {audit_report['average_difficulty_score']}/3.0")

    # Run 150 simulated playtests for Casual and Pro
    sim_casual = PlaytestSimulator.run_simulation(audit_report, runs=150, skill_level="casual")
    sim_pro = PlaytestSimulator.run_simulation(audit_report, runs=150, skill_level="pro")

    all_results.append({
        "level_num": lvl_num,
        "name": name,
        "audit": audit_report,
        "sim_casual": sim_casual,
        "sim_pro": sim_pro
    })

# Save output to both frog-game and nova-dashboard
out_path_game = "batch_simulation_results.json"
with open(out_path_game, "w", encoding="utf-8") as f:
    json.dump(all_results, f, indent=2)
print(f"\nSaved to {out_path_game}")

out_path_nova = "/home/robbie/nova-dashboard/public/frog_simulation_results.json"
os.makedirs(os.path.dirname(out_path_nova), exist_ok=True)
with open(out_path_nova, "w", encoding="utf-8") as f:
    json.dump(all_results, f, indent=2)
print(f"Saved to {out_path_nova}")
