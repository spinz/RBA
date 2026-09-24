import unittest

from simulate import PlaytestSimulator


def make_jump(index, reachable=True, difficulty=1.0, fairness="FAIR_CHALLENGE"):
    return {
        "jump_index": index,
        "from_node": f"Node {index}",
        "to_node": f"Node {index + 1}",
        "difficulty_score": difficulty,
        "fairness": fairness,
        "kinematics": {"is_reachable": reachable},
    }


class PlaytestSimulatorTests(unittest.TestCase):
    def test_seed_makes_results_reproducible(self):
        report = {"level_name": "Test", "jumps": [make_jump(1), make_jump(2)]}

        first = PlaytestSimulator.run_simulation(report, runs=50, seed=42)
        second = PlaytestSimulator.run_simulation(report, runs=50, seed=42)

        self.assertEqual(first, second)
        self.assertGreaterEqual(first["clear_rate_percent"], first["flawless_rate_percent"])

    def test_run_ends_after_lives_are_exhausted(self):
        report = {
            "level_name": "Impossible",
            "jumps": [make_jump(index, reachable=False) for index in range(1, 6)],
        }

        result = PlaytestSimulator.run_simulation(report, runs=10, seed=1)

        self.assertEqual(result["completed_runs"], 0)
        self.assertEqual(result["total_falls"], 30)
        self.assertEqual(result["choke_point_heatmap"][3]["falls_count"], 0)


if __name__ == "__main__":
    unittest.main()
