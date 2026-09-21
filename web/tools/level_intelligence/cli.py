#!/usr/bin/env python3
"""
Frog Game Level Intelligence CLI
Powered by TypeSafe JEV System 1 Non-Autoregressive Decision Engine.

Usage:
  python3 -m tools.level_intelligence.cli audit [level_num]
  python3 -m tools.level_intelligence.cli simulate [level_num] [--runs 100] [--skill casual]
  python3 -m tools.level_intelligence.cli generate [--name "Firefly Marsh"] [--width 3000]
  python3 -m tools.level_intelligence.cli export-level5
"""

import sys
import os
import argparse
import json
import re
from .auditor import LevelAuditor
from .simulate import PlaytestSimulator
from .generator import LevelDirectorGenerator

JS_LEVELS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../js/levels.js"))

def cmd_audit(args):
    auditor = LevelAuditor()
    levels = auditor.parse_js_levels(JS_LEVELS_PATH)
    level_idx = args.level - 1

    if level_idx < 0 or level_idx >= len(levels):
        print(f"Error: Level {args.level} not found. Available levels: 1 to {len(levels)}")
        sys.exit(1)

    target_level = levels[level_idx]
    print(f"\n[JEV AUDITOR] Auditing Level {args.level}: '{target_level['name']}'...")
    report = auditor.audit_level(target_level, max_jumps_to_audit=args.max_jumps)

    print(f"\n=======================================================")
    print(f" AUDIT REPORT: {report['level_name']}")
    print(f"=======================================================")
    print(f"- Total Crossings Audited: {report['total_jumps_audited']}")
    print(f"- Average Difficulty:      {report['average_difficulty_score']}/3.0")
    print(f"- Unfair Jumps Flagged:    {report['unfair_jumps_flagged']}")
    print(f"- Tight Execution Jumps:   {report['tight_execution_jumps']}")
    print(f"- Blind Leap Risks:        {report['blind_leap_risks']}")
    print(f"-------------------------------------------------------")
    for j in report["jumps"]:
        kin = j["kinematics"]
        print(f"\nJump #{j['jump_index']}: {j['from_node']} -> {j['to_node']}")
        print(f"  Gap: dx={j['gap_x']:.0f}px, dy={j['gap_y']:.0f}px | Required Speed: {kin['req_speed']}px/s (Base: 200px/s)")
        assist = kin.get('assist_type', kin.get('reason', 'Unreachable'))
        print(f"  Reachability: {'[PASS]' if kin['is_reachable'] else '[IMPOSSIBLE]'} ({assist})")
        print(f"  JEV Verdict:  {j['fairness']} (Diff: {j['difficulty_score']}/3.0, Flow: {j['pacing_rhythm']})")
        if j['blind_leap_risk'] > 0.4:
            print(f"  Warning: Blind leap risk detected ({j['blind_leap_risk']:.2f})")
    print(f"=======================================================\n")

def cmd_simulate(args):
    auditor = LevelAuditor()
    levels = auditor.parse_js_levels(JS_LEVELS_PATH)
    level_idx = args.level - 1

    if level_idx < 0 or level_idx >= len(levels):
        print(f"Error: Level {args.level} not found.")
        sys.exit(1)

    target_level = levels[level_idx]
    print(f"\n[JEV SIMULATOR] Auditing & Running {args.runs} Virtual Playtest Runs on '{target_level['name']}' ({args.skill})...")
    report = auditor.audit_level(target_level, max_jumps_to_audit=args.max_jumps)
    sim = PlaytestSimulator.run_simulation(report, runs=args.runs, skill_level=args.skill)

    print(f"\n=======================================================")
    print(f" MONTE CARLO PLAYTEST RESULTS: {sim['level_name']}")
    print(f" Skill Profile: {sim['skill_profile']}")
    print(f"=======================================================")
    print(f"- Simulated Runs:          {sim['total_simulated_runs']}")
    print(f"- Flawless Clear Rate:     {sim['clear_rate_percent']}%")
    print(f"- Total Water Falls/Hurt:  {sim['total_falls']} (Avg {sim['avg_falls_per_run']} per run)")
    print(f"-------------------------------------------------------")
    print(" CHOKE POINT HEATMAP (Failure Rate by Jump):")
    for pt in sim["choke_point_heatmap"]:
        bar = "#" * int(pt["fall_rate_percent"] / 2.5)
        print(f"  Jump #{pt['jump_index']}: [{pt['fall_rate_percent']:>5.1f}%] {bar:<25} {pt['label']}")
    print(f"=======================================================\n")

def cmd_generate(args):
    gen = LevelDirectorGenerator()
    print(f"\n[JEV DIRECTOR] Procedurally generating '{args.name}' (Target Width: {args.width}px)...")
    result = gen.generate_level(level_id=args.id, level_name=args.name, target_width=args.width)

    level = result["level"]
    audit = result["audit"]
    pacing = result["pacing_history"]

    print(f"\n=======================================================")
    print(f" GENERATION COMPLETE: {level['name']} (ID: {level['id']})")
    print(f"=======================================================")
    print(f"- Stage Dimensions:        {level['width']}px x {level['height']}px")
    print(f"- Director Pacing Flow:    {' -> '.join(pacing)}")
    print(f"- Platforms Placed:        {len(level['platforms'])}")
    print(f"- Lilypads: {len(level['lilypads'])} | Mushrooms: {len(level['mushrooms'])} | Water Pits: {len(level['waterPits'])}")
    print(f"- Collectibles: {len(level['fireflies'])} Fireflies, {len(level['goldenLotus'])} Golden Lotus")
    print(f"- Enemies: {len(level['beetles'])} Beetles, {len(level['mosquitoes'])} Mosquitoes")
    print(f"-------------------------------------------------------")
    print(f" JEV VERIFICATION SCORECARD:")
    print(f"- Average Difficulty:      {audit['average_difficulty_score']}/3.0")
    print(f"- Unfair Jumps:            {audit['unfair_jumps_flagged']} (Self-healed)")
    print(f"- Blind Leap Risks:        {audit['blind_leap_risks']}")
    print(f"=======================================================\n")

    if args.export_json:
        with open(args.export_json, "w", encoding="utf-8") as f:
            json.dump(level, f, indent=2)
        print(f"Saved level JSON to: {args.export_json}")

def cmd_export_level5(args):
    gen = LevelDirectorGenerator()
    print(f"\n[JEV EXPORT] Generating and injecting verified Level 5: Firefly Marsh into {JS_LEVELS_PATH}...")
    result = gen.generate_level(level_id=5, level_name="Firefly Marsh", target_width=2800)
    level = result["level"]

    # Read existing levels.js
    with open(JS_LEVELS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if Level 5 already exists
    if "LEVEL 5: Firefly Marsh" in content:
        print("Notice: Level 5 already exists in levels.js. Replacing with freshly generated version...")
        # Replace existing Level 5 block
        content = re.sub(
            r"// --- LEVEL 5: Firefly Marsh[\s\S]*?(?=\n\s*\];\s*\})",
            LevelDirectorGenerator.to_js_code(level),
            content
        )
    else:
        # Insert before the closing `];` of getLevels()
        insertion = "\n,\n" + LevelDirectorGenerator.to_js_code(level) + "\n"
        content = re.sub(r"(\n\s*\];\s*\})", insertion + r"\1", content)

    with open(JS_LEVELS_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] Successfully exported Level 5: Firefly Marsh directly into js/levels.js!")
    print(f"Open http://localhost:3040 in your browser to play the newly generated level!")

def main():
    parser = argparse.ArgumentParser(description="Frog Game Level Intelligence with TypeSafe JEV System 1")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # audit
    p_audit = subparsers.add_parser("audit", help="Audit a level's fairness, difficulty, and pacing")
    p_audit.add_argument("level", type=int, nargs="?", default=1, help="Level number (default: 1)")
    p_audit.add_argument("--max-jumps", type=int, default=8, help="Max jumps to audit")

    # simulate
    p_sim = subparsers.add_parser("simulate", help="Run virtual playtest Monte Carlo simulation")
    p_sim.add_argument("level", type=int, nargs="?", default=1, help="Level number (default: 1)")
    p_sim.add_argument("--runs", type=int, default=100, help="Number of simulated playtests (default: 100)")
    p_sim.add_argument("--skill", choices=["novice", "casual", "pro"], default="casual", help="Simulated player skill")
    p_sim.add_argument("--max-jumps", type=int, default=20, help="Max jumps to audit & simulate (default: 20)")

    # generate
    p_gen = subparsers.add_parser("generate", help="Procedurally generate a new level with JEV Pacing Director")
    p_gen.add_argument("--id", type=int, default=5, help="Level ID (default: 5)")
    p_gen.add_argument("--name", default="Firefly Marsh", help="Level name")
    p_gen.add_argument("--width", type=int, default=2800, help="Target level width in pixels")
    p_gen.add_argument("--export-json", help="Optional path to export JSON file")

    # export-level5
    subparsers.add_parser("export-level5", help="Generate Level 5 and write it into js/levels.js")

    args = parser.parse_args()
    if args.command == "audit":
        cmd_audit(args)
    elif args.command == "simulate":
        cmd_simulate(args)
    elif args.command == "generate":
        cmd_generate(args)
    elif args.command == "export-level5":
        cmd_export_level5(args)

if __name__ == "__main__":
    main()
