import math
from typing import Dict, Any, Tuple, Optional

class RibbitPhysics:
    """
    Kinematic model of Ribbit's platformer movement from player.js / player.gd.
    Screen coordinates: +x is right, +y is down.
    """
    GRAVITY = 1000.0            # px/s^2 (downward)
    BASE_SPEED = 200.0          # px/s (standard run)
    MAX_SPRINT_SPEED = 250.0    # px/s (full momentum)
    NORMAL_JUMP_VEL = -440.0    # px/s (upward)
    SUPER_JUMP_VEL = -640.0     # px/s (spring mushroom)
    TONGUE_REACH = 135.0        # px
    COYOTE_TIME = 0.12          # seconds

    @classmethod
    def analyze_jump(cls, start_pos: Tuple[float, float], target_pos: Tuple[float, float], 
                     has_mushroom: bool = False, has_tongue_anchor: bool = False) -> Dict[str, Any]:
        """
        Calculates exact physical jump parameters from start_pos (x1, y1) to target_pos (x2, y2).
        Returns kinematic metrics: flight time, required horizontal velocity, 
        apex height, and physical reachability.
        """
        x1, y1 = start_pos
        x2, y2 = target_pos
        dx = x2 - x1
        dy = y2 - y1  # negative means target is higher than start

        vy0 = cls.SUPER_JUMP_VEL if has_mushroom else cls.NORMAL_JUMP_VEL
        
        # Max upward rise (negative dy):
        # apex happens when vy = 0 => t_apex = -vy0 / g
        t_apex = -vy0 / cls.GRAVITY
        max_rise = -(vy0 ** 2) / (2 * cls.GRAVITY) # negative number (e.g. -96.8px)

        # Check if target is higher than apex
        is_height_reachable = dy >= max_rise
        
        # Calculate landing time t_land
        # 0.5 * g * t^2 + vy0 * t - dy = 0
        discriminant = (vy0 ** 2) + 2 * cls.GRAVITY * dy
        
        if discriminant < 0:
            return {
                "is_reachable": False,
                "reason": f"Target is too high (-dy={-dy:.1f}px > max rise {max_rise:.1f}px)",
                "dx": dx,
                "dy": dy,
                "max_rise": max_rise,
                "flight_time": 0.0,
                "apex_time": 0.0,
                "req_speed": 999.0,
                "base_speed": cls.BASE_SPEED,
                "max_sprint_speed": cls.MAX_SPRINT_SPEED,
                "assist_type": "Height Exceeded",
                "has_mushroom": has_mushroom
            }

        t_land = (-vy0 + math.sqrt(discriminant)) / cls.GRAVITY
        
        # Required horizontal velocity to bridge dx in t_land
        req_speed = abs(dx) / t_land if t_land > 0 else 999.0

        # Reachability classifications:
        # Standard: req_speed <= BASE_SPEED (200 px/s)
        # Sprint: req_speed <= MAX_SPRINT_SPEED (250 px/s)
        # Tongue assist: within reach + 0.8 * TONGUE_REACH
        is_reachable = req_speed <= cls.MAX_SPRINT_SPEED
        
        if not is_reachable and has_tongue_anchor and abs(dx) <= (cls.MAX_SPRINT_SPEED * t_land + cls.TONGUE_REACH):
            is_reachable = True
            assist = "Tongue Grapple Assist"
        elif req_speed <= cls.BASE_SPEED:
            assist = "Standard Hop"
        elif req_speed <= cls.MAX_SPRINT_SPEED:
            assist = "Sprint Momentum Jump"
        else:
            assist = "Impossible Gap"

        return {
            "is_reachable": is_reachable,
            "dx": dx,
            "dy": dy,
            "max_rise": max_rise,
            "flight_time": round(t_land, 3),
            "apex_time": round(t_apex, 3),
            "req_speed": round(req_speed, 1),
            "base_speed": cls.BASE_SPEED,
            "max_sprint_speed": cls.MAX_SPRINT_SPEED,
            "assist_type": assist,
            "has_mushroom": has_mushroom
        }

    @classmethod
    def get_trajectory_arc(cls, x1: float, y1: float, x2: float, y2: float, 
                           steps: int = 6, has_mushroom: bool = False) -> list:
        """
        Generates sample points along the optimal jump parabola between two points.
        Useful for placing collectible fireflies in a natural arc!
        """
        analysis = cls.analyze_jump((x1, y1), (x2, y2), has_mushroom=has_mushroom)
        if not analysis["is_reachable"]:
            return []

        t_land = analysis["flight_time"]
        vx = analysis["dx"] / t_land
        vy0 = cls.SUPER_JUMP_VEL if has_mushroom else cls.NORMAL_JUMP_VEL

        arc = []
        for i in range(1, steps):
            t = (i / steps) * t_land
            x = x1 + vx * t
            y = y1 + vy0 * t + 0.5 * cls.GRAVITY * (t ** 2)
            arc.append({"x": round(x, 1), "y": round(y, 1)})
        return arc
