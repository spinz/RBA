import unittest
from web.tools.level_intelligence.auditor import LevelAuditor
from web.tools.level_intelligence.jev_client import JevEngine


class OfflineAuditTests(unittest.TestCase):
    def test_explicit_offline_mode_and_impossible_gap(self):
        auditor = LevelAuditor(JevEngine(api_key=""))
        report = auditor.audit_level({"platforms": [
            {"x": 0, "y": 500, "w": 100, "h": 32},
            {"x": 1500, "y": 500, "w": 100, "h": 32},
        ]})
        self.assertEqual(report["unfair_jumps_flagged"], 1)
        self.assertEqual(report["jumps"][0]["gap_x"], 1372)

    def test_lilypad_uses_centered_runtime_bounds(self):
        auditor = LevelAuditor(JevEngine(api_key=""))
        report = auditor.audit_level({
            "platforms": [{"x": 0, "y": 500, "w": 100, "h": 32}],
            "lilypads": [{"x": 200, "y": 510}],
        })
        self.assertEqual(report["jumps"][0]["gap_x"], 40)
        self.assertEqual(report["jumps"][0]["gap_y"], 0)
