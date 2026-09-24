import json
from typing import Dict, Any, List, Optional
from .physics_model import RibbitPhysics
from .jev_client import JevEngine

class LevelAuditor:
    """
    Audits 2D platformer levels using deterministic physics + TypeSafe JEV System 1 intelligence.
    Evaluates jump fairness, hazard precision, blind leaps, and pacing flow.
    """
    def __init__(self, jev: Optional[JevEngine] = None):
        self.jev = jev or JevEngine()

    @staticmethod
    def parse_level_data(levels_path: str) -> List[Dict[str, Any]]:
        """Load the canonical JSON consumed by the web runtime."""
        with open(levels_path, "r", encoding="utf-8") as f:
            levels = json.load(f)
        if not isinstance(levels, list):
            raise ValueError("Canonical level data must be a JSON array.")
        return levels

    parse_js_levels = parse_level_data

    def audit_level(self, level: Dict[str, Any], max_jumps_to_audit: int = 8) -> Dict[str, Any]:
        """
        Audits a level layout step-by-step.
        Identifies key traversal nodes (platforms, lilypads, mushrooms) and scores each crossing.
        """
        level_name = level.get("name", "Unnamed Level")
        platforms = sorted(level.get("platforms", []), key=lambda p: p["x"])
        lilypads = sorted(level.get("lilypads", []), key=lambda l: l["x"])
        mushrooms = sorted(level.get("mushrooms", []), key=lambda m: m["x"])
        water_pits = level.get("waterPits", [])
        beetles = level.get("beetles", [])
        mosquitoes = level.get("mosquitoes", [])

        # Build traversal sequence: sort all landing entities by x coordinate
        traversal_nodes = []
        for p in platforms:
            traversal_nodes.append({
                "type": "platform",
                "x": p["x"],
                "y": p["y"],
                "w": p.get("w", 100),
                "h": p.get("h", 40),
                "desc": f"Platform '{p.get('type', 'ground')}' ({p.get('w', 100)}px wide)"
            })
        for lp in lilypads:
            traversal_nodes.append({
                "type": "lilypad",
                "x": lp["x"],
                "y": lp["y"],
                "w": 56, # standard lilypad width
                "h": 12,
                "desc": "Floating Lilypad"
            })

        traversal_nodes.sort(key=lambda n: n["x"])

        # Audit transitions between consecutive nodes
        jump_evaluations = []
        node_count = min(len(traversal_nodes) - 1, max_jumps_to_audit)

        for i in range(node_count):
            curr_node = traversal_nodes[i]
            next_node = traversal_nodes[i + 1]

            # Right edge of current node to left edge of next node
            start_x = curr_node["x"] + curr_node["w"]
            start_y = curr_node["y"]
            target_x = next_node["x"]
            target_y = next_node["y"]

            gap_x = target_x - start_x
            gap_y = target_y - start_y

            # Skip overlapping or directly adjacent blocks
            if gap_x <= 10:
                continue

            # Check if there's a mushroom nearby on current platform
            has_mushroom = any(curr_node["x"] <= m["x"] <= start_x + 30 for m in mushrooms)

            # Physics evaluation
            kinematics = RibbitPhysics.analyze_jump(
                (start_x, start_y), 
                (target_x, target_y), 
                has_mushroom=has_mushroom
            )

            # Context check: is there water or enemies in this gap?
            has_water = any(w["x"] <= start_x + (gap_x / 2) <= w["x"] + w["w"] for w in water_pits)
            nearby_beetle = any(curr_node["x"] <= b["x"] <= target_x for b in beetles)
            nearby_mosquito = any(start_x - 50 <= m["x"] <= target_x + 50 for m in mosquitoes)

            # Construct compact state for JEV System 1 query
            state_summary = (
                f"Game: Frog Game (Ribbit). Level: {level_name}. Jump #{i+1}: "
                f"From {curr_node['desc']} [x={start_x:.0f}, y={start_y:.0f}] "
                f"to {next_node['desc']} [x={target_x:.0f}, y={target_y:.0f}]. "
                f"Gap: {gap_x:.0f}px horizontal, {gap_y:.0f}px vertical. "
                f"Mushroom boost: {'Yes' if has_mushroom else 'No'}. "
                f"Water pit hazard below: {'Yes' if has_water else 'No'}. "
                f"Nearby enemy: {'Beetle on ledge' if nearby_beetle else 'Mosquito in air' if nearby_mosquito else 'None'}. "
                f"Physics Kinematics: Reachable={kinematics['is_reachable']}, "
                f"ReqSpeed={kinematics['req_speed']}px/s (Base=200, Sprint=250), "
                f"FlightTime={kinematics['flight_time']}s."
            )

            questions = {
                "fairness": {
                    "type": "choice",
                    "instructions": "Evaluate platforming fairness and player frustration potential.",
                    "criteria": {
                        "COMFORTABLE": "Generous landing zone and forgiving physics with low hazard threat",
                        "FAIR_CHALLENGE": "Requires deliberate timing and momentum, but completely fair",
                        "TIGHT_EXECUTION": "High precision jump with narrow margin for error",
                        "UNFAIR": "Blind leap, unavoidable hazard collision, or physically impossible"
                    }
                },
                "difficulty_score": {
                    "type": "score",
                    "instructions": "Rate jump difficulty on a progressive 0-3 scale",
                    "criteria": [
                        "Trivial hop with zero risk",
                        "Standard casual platforming jump",
                        "Precision leap requiring solid momentum and timing",
                        "Extreme pixel-tight or punishing hazard leap"
                    ]
                },
                "blind_leap_risk": {
                    "type": "noul",
                    "instructions": "Is this jump at risk of feeling like a blind off-screen leap?"
                },
                "pacing_rhythm": {
                    "type": "choice",
                    "instructions": "What pacing function does this section serve in the level arc?",
                    "criteria": {
                        "BREATHER": "Restful transition allowing the player to reset focus",
                        "TENSION_BUILD": "Active challenge escalating difficulty",
                        "SKILL_CHECK": "Prominent test of player mastery",
                        "CLIMAX": "Peak intense gauntlet before safety"
                    }
                }
            }

            jev_result = self.jev.decide(state=state_summary, questions=questions)
            answers = jev_result.get("answers", {})

            jump_evaluations.append({
                "jump_index": i + 1,
                "from_node": curr_node["desc"],
                "to_node": next_node["desc"],
                "gap_x": round(gap_x, 1),
                "gap_y": round(gap_y, 1),
                "kinematics": kinematics,
                "fairness": answers.get("fairness", {}).get("choice", "UNKNOWN"),
                "fairness_probs": answers.get("fairness", {}).get("probabilities", {}),
                "difficulty_score": round(answers.get("difficulty_score", {}).get("score", 0.0), 2),
                "blind_leap_risk": round(answers.get("blind_leap_risk", {}).get("noul", 0.0), 2),
                "pacing_rhythm": answers.get("pacing_rhythm", {}).get("choice", "UNKNOWN")
            })

        # Calculate overall level statistics
        avg_difficulty = (
            sum(j["difficulty_score"] for j in jump_evaluations) / len(jump_evaluations)
            if jump_evaluations else 0.0
        )
        unfair_count = sum(1 for j in jump_evaluations if j["fairness"] == "UNFAIR")
        tight_count = sum(1 for j in jump_evaluations if j["fairness"] == "TIGHT_EXECUTION")
        blind_count = sum(1 for j in jump_evaluations if j["blind_leap_risk"] > 0.6)

        return {
            "level_name": level_name,
            "total_jumps_audited": len(jump_evaluations),
            "average_difficulty_score": round(avg_difficulty, 2),
            "unfair_jumps_flagged": unfair_count,
            "tight_execution_jumps": tight_count,
            "blind_leap_risks": blind_count,
            "jumps": jump_evaluations
        }
