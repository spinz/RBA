import json
from typing import Dict, Any, List, Optional
from .physics_model import RibbitPhysics
from .jev_client import JevEngine
from .auditor import LevelAuditor

class LevelDirectorGenerator:
    """
    Procedural Level Generator using TypeSafe JEV System 1 as the Pacing Director.
    Generates balanced, rhythmic, and verified stages for Ribbit's Big Adventure.
    """
    def __init__(self, jev: Optional[JevEngine] = None):
        self.jev = jev or JevEngine()

    def generate_level(self, level_id: int = 5, level_name: str = "Firefly Marsh", 
                       target_width: int = 3000, theme_difficulty: str = "balanced") -> Dict[str, Any]:
        """
        Generates a complete, verified level specification.
        Uses JEV to pace segments between Breathers, Lake Crossings, Mushroom Climbs, and Gauntlets.
        """
        height = 600
        player_start = {"x": 90, "y": 430}

        platforms = []
        lilypads = []
        mushrooms = []
        cattails = []
        water_pits = []
        fireflies = []
        golden_lotus = []
        beetles = []
        mosquitoes = []

        # 1. Starting Ground (Safe Breather Zone)
        curr_x = 0
        curr_y = 500
        start_w = 480
        platforms.append({"x": curr_x, "y": curr_y, "w": start_w, "h": 100, "type": "ground"})
        
        # Starter decorations
        cattails.append({"x": 120, "y": 476})
        cattails.append({"x": 420, "y": 476})
        beetles.append({"x": 260, "y": 482, "patrol": 80})

        curr_x += start_w
        progress_pct = int((curr_x / target_width) * 100)
        recent_chunks = ["SAFE_START"]

        # 2. Segment Generation Loop
        segment_index = 1
        while curr_x < (target_width - 500):
            progress_pct = int((curr_x / target_width) * 100)

            # Query JEV Pacing Director for the next beat
            state = (
                f"Level: {level_name}. Theme: {theme_difficulty}. "
                f"Progress: {progress_pct}% (x={curr_x}). "
                f"Recent 2 segments: {recent_chunks[-2:]}. Current platform elevation: y={curr_y}."
            )
            questions = {
                "next_chunk": {
                    "type": "choice",
                    "instructions": "Select the next platforming chunk to maintain engaging pacing and flow rhythm.",
                    "criteria": {
                        "LILYPAD_LAKE": "Water pit with 2-3 floating lilypad stepping stones",
                        "MUSHROOM_ELEVATION": "Spring mushroom launch to a high elevated canopy ledge",
                        "STEPPED_ISLANDS": "Ground island with varying elevation steps and a patrolling beetle",
                        "BREATHER_REST": "Wide safe ground with decorative cattails to reset player focus"
                    }
                },
                "hazard_density": {
                    "type": "score",
                    "instructions": "Determine the hazard challenge level for this upcoming segment",
                    "criteria": [
                        "Zero hazard threat (peaceful)",
                        "Low hazard (single patrolling beetle or floating firefly lure)",
                        "Medium hazard (mosquito air patrol requiring jump timing)",
                        "High challenge (combined water hazard with enemy air control)"
                    ]
                }
            }

            jev_decision = self.jev.decide(state=state, questions=questions)
            answers = jev_decision.get("answers", {})
            chunk_type = answers.get("next_chunk", {}).get("choice", "LILYPAD_LAKE")
            recent_chunks.append(chunk_type)

            # --- BUILD CHUNK BASED ON JEV DECISION ---
            if chunk_type == "LILYPAD_LAKE":
                pit_w = 280
                water_pits.append({"x": curr_x, "y": 530, "w": pit_w, "h": 70})
                
                # Place 2 lilypads with verified leap distances
                pad1_x = curr_x + 90
                pad2_x = curr_x + 190
                lilypads.append({"x": pad1_x, "y": 512})
                lilypads.append({"x": pad2_x, "y": 508})

                # Arc fireflies above the crossing
                fireflies.extend(RibbitPhysics.get_trajectory_arc(curr_x, curr_y, pad1_x, 512, steps=3))
                fireflies.extend(RibbitPhysics.get_trajectory_arc(pad2_x, 508, curr_x + pit_w + 30, curr_y, steps=3))

                curr_x += pit_w
                # Landing island
                landing_w = 220
                platforms.append({"x": curr_x, "y": curr_y, "w": landing_w, "h": 100, "type": "ground"})
                cattails.append({"x": curr_x + 20, "y": curr_y - 24})
                curr_x += landing_w

            elif chunk_type == "MUSHROOM_ELEVATION":
                # Ground with spring mushroom leading to high grass ledge
                launch_w = 180
                platforms.append({"x": curr_x, "y": curr_y, "w": launch_w, "h": 100, "type": "ground"})
                mush_x = curr_x + 110
                mush_y = curr_y - 38
                mushrooms.append({"x": mush_x, "y": mush_y})

                # High elevated grass ledge
                ledge_x = curr_x + 160
                ledge_y = curr_y - 140 # High ledge
                ledge_w = 180
                platforms.append({"x": ledge_x, "y": ledge_y, "w": ledge_w, "h": 32, "type": "grass"})

                # Arc of bonus fireflies on mushroom leap
                fireflies.extend(RibbitPhysics.get_trajectory_arc(mush_x, mush_y, ledge_x + 40, ledge_y, steps=4, has_mushroom=True))

                # Secret golden lotus on high ledge if in late stage
                if progress_pct > 50 and not golden_lotus:
                    golden_lotus.append({"x": ledge_x + 80, "y": ledge_y - 36})

                curr_x = ledge_x + ledge_w
                curr_y = ledge_y # Player is now elevated!

            elif chunk_type == "STEPPED_ISLANDS":
                gap_w = 100
                water_pits.append({"x": curr_x, "y": 530, "w": gap_w, "h": 70})
                curr_x += gap_w

                step1_w = 160
                step1_y = 440 if curr_y > 400 else 360
                platforms.append({"x": curr_x, "y": step1_y, "w": step1_w, "h": 60, "type": "ground"})
                beetles.append({"x": curr_x + 40, "y": step1_y - 18, "patrol": 60})
                curr_x += step1_w
                curr_y = step1_y

            else: # BREATHER_REST
                safe_w = 260
                safe_y = 500
                gap_w = 70
                water_pits.append({"x": curr_x, "y": 530, "w": gap_w, "h": 70})
                curr_x += gap_w

                platforms.append({"x": curr_x, "y": safe_y, "w": safe_w, "h": 100, "type": "ground"})
                cattails.append({"x": curr_x + 30, "y": safe_y - 24})
                cattails.append({"x": curr_x + 200, "y": safe_y - 24})
                curr_x += safe_w
                curr_y = safe_y

            # Add occasional aerial mosquito for timing
            if progress_pct > 30 and segment_index % 2 == 0:
                mosquitoes.append({"x": curr_x - 100, "y": curr_y - 90, "range": 50})

            segment_index += 1

        # 3. Final Climax & Victory Goal Island
        final_pit_w = 160
        water_pits.append({"x": curr_x, "y": 530, "w": final_pit_w, "h": 70})
        # Lilypad bridge to goal
        lilypads.append({"x": curr_x + 75, "y": 512})
        curr_x += final_pit_w

        goal_w = 460
        platforms.append({"x": curr_x, "y": 480, "w": goal_w, "h": 120, "type": "ground"})
        cattails.append({"x": curr_x + 40, "y": 456})
        cattails.append({"x": curr_x + 400, "y": 456})
        
        goal_x = curr_x + 350
        goal_y = 424

        level_data = {
            "id": level_id,
            "name": level_name,
            "width": curr_x + goal_w + 100,
            "height": height,
            "playerStart": player_start,
            "platforms": platforms,
            "lilypads": lilypads,
            "mushrooms": mushrooms,
            "cattails": cattails,
            "waterPits": water_pits,
            "fireflies": fireflies,
            "goldenLotus": golden_lotus if golden_lotus else [{"x": curr_x + 180, "y": 360}],
            "beetles": beetles,
            "mosquitoes": mosquitoes,
            "goal": {"x": goal_x, "y": goal_y}
        }

        # Run automated audit and auto-remedy loop
        auditor = LevelAuditor(jev=self.jev)
        
        # Self-healing / Auto-remedy loop
        max_remedy_passes = 2
        for remedy_pass in range(max_remedy_passes):
            audit_report = auditor.audit_level(level_data, max_jumps_to_audit=12)
            has_unfair = False

            for j in audit_report["jumps"]:
                if j["fairness"] == "UNFAIR" or not j["kinematics"]["is_reachable"]:
                    has_unfair = True
                    # Auto-remedy: If target too high (dy < -80px) and no mushroom, lower target platform
                    if j["gap_y"] < -80:
                        # Find the target platform and lower it
                        for p in level_data["platforms"]:
                            if abs((p["x"]) - (j["gap_x"] + p["x"])) < 50 or (p["y"] < 400 and j["gap_y"] < -80):
                                p["y"] = min(500, p["y"] + 60) # Bring platform down to reachable height
                    elif j["gap_x"] > 180:
                        # Gap too wide: add an intermediate lilypad
                        mid_x = (j["gap_x"] / 2)
                        level_data["lilypads"].append({"x": round(mid_x, 1), "y": 512})

            if not has_unfair:
                break

        # Final audit pass
        audit_report = auditor.audit_level(level_data, max_jumps_to_audit=12)

        return {
            "level": level_data,
            "audit": audit_report,
            "pacing_history": recent_chunks
        }

