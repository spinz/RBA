import random
from typing import Dict, Any, List

class PlaytestSimulator:
    """
    Simulates virtual player runs across audited platformer levels.
    Uses JEV difficulty ratings & physical reachability to model player success rates and identify choke points.
    """
    SKILL_PROFILES = {
        "novice": {
            "name": "Novice (First-time Player)",
            "base_accuracy": 0.72,
            "tight_jump_penalty": 0.45,
            "hazard_anxiety_penalty": 0.15
        },
        "casual": {
            "name": "Casual (Standard Platformer Fan)",
            "base_accuracy": 0.88,
            "tight_jump_penalty": 0.25,
            "hazard_anxiety_penalty": 0.08
        },
        "pro": {
            "name": "Speedrunner / Veteran",
            "base_accuracy": 0.98,
            "tight_jump_penalty": 0.08,
            "hazard_anxiety_penalty": 0.02
        }
    }

    @classmethod
    def run_simulation(cls, audit_report: Dict[str, Any], runs: int = 100, skill_level: str = "casual") -> Dict[str, Any]:
        profile = cls.SKILL_PROFILES.get(skill_level, cls.SKILL_PROFILES["casual"])
        jumps = audit_report.get("jumps", [])
        
        if not jumps:
            return {"error": "No jumps to simulate in audit report"}

        choke_point_tracker = {j["jump_index"]: 0 for j in jumps}
        successful_runs = 0
        total_falls = 0

        for run_id in range(runs):
            lives = 3
            fell_in_run = False
            completed_level = True

            for jump in jumps:
                kinematics = jump["kinematics"]
                if not kinematics.get("is_reachable", True):
                    # Physically impossible jump: 100% fail
                    choke_point_tracker[jump["jump_index"]] += 1
                    total_falls += 1
                    fell_in_run = True
                    lives -= 1
                    if lives <= 0:
                        completed_level = False
                    continue

                # Calculate success probability based on JEV difficulty (0 to 3 scale)
                diff = jump.get("difficulty_score", 1.0)
                fairness = jump.get("fairness", "FAIR_CHALLENGE")
                
                # Base success odds
                p_success = profile["base_accuracy"] - (diff / 3.0) * 0.35

                if fairness == "TIGHT_EXECUTION":
                    p_success -= profile["tight_jump_penalty"]
                elif fairness == "UNFAIR":
                    p_success *= 0.15

                # Roll check
                if random.random() > max(0.05, min(0.99, p_success)):
                    # Player missed jump / took water fall
                    choke_point_tracker[jump["jump_index"]] += 1
                    total_falls += 1
                    fell_in_run = True
                    lives -= 1
                    if lives <= 0:
                        completed_level = False

            if not fell_in_run:
                successful_runs += 1

        # Compile heatmap
        heatmap = []
        for jump in jumps:
            idx = jump["jump_index"]
            falls = choke_point_tracker[idx]
            fall_rate = (falls / runs) * 100
            heatmap.append({
                "jump_index": idx,
                "label": f"{jump['from_node']} -> {jump['to_node']}",
                "difficulty": jump["difficulty_score"],
                "falls_count": falls,
                "fall_rate_percent": round(fall_rate, 1)
            })

        return {
            "level_name": audit_report.get("level_name", "Unknown"),
            "skill_profile": profile["name"],
            "total_simulated_runs": runs,
            "flawless_runs": successful_runs,
            "clear_rate_percent": round((successful_runs / runs) * 100, 1),
            "total_falls": total_falls,
            "avg_falls_per_run": round(total_falls / runs, 2),
            "choke_point_heatmap": heatmap
        }
