import unittest
import time
import numpy as np
from app.core.trajectory_matcher import (
    TrajectoryMatchingEngine,
    levenshtein_similarity,
    cosine_similarity,
    haversine_distance
)

class TestTrajectoryMatcher(unittest.TestCase):
    def setUp(self):
        self.matcher = TrajectoryMatchingEngine()
        self.matcher.register_camera("CAM-N-01", 28.6328, 77.2197, "North Gate")
        self.matcher.register_camera("CAM-N-02", 28.6310, 77.2160, "Central Blvd")
        self.matcher.register_camera("CAM-N-04", 28.6250, 77.2180, "South Ave")

    def test_levenshtein_similarity(self):
        self.assertAlmostEqual(levenshtein_similarity("HR-26-DK-9921", "HR26DK9921"), 1.0)
        self.assertGreater(levenshtein_similarity("HR-26-DK-9921", "HR-26-DK-9920"), 0.85)
        self.assertLess(levenshtein_similarity("HR-26-DK-9921", "DL-01-AB-1234"), 0.4)

    def test_cosine_similarity(self):
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        v3 = [0.0, 1.0, 0.0]
        self.assertAlmostEqual(cosine_similarity(v1, v2), 1.0)
        self.assertAlmostEqual(cosine_similarity(v1, v3), 0.0)

    def test_exact_plate_matching(self):
        t0 = time.time()
        det1 = {
            "camera_id": "CAM-N-01",
            "timestamp": t0,
            "local_track_id": 101,
            "plate_text": "HR-26-DK-9921",
            "plate_confidence": 0.98,
            "reid_embedding": [0.1] * 512
        }
        gid1, match_type1, score1, _ = self.matcher.match_detection(det1)
        self.assertEqual(match_type1, "NEW_TRACK")

        # Vehicle moves to CAM-N-02 20 seconds later (speed ~ 74 km/h)
        det2 = {
            "camera_id": "CAM-N-02",
            "timestamp": t0 + 20,
            "local_track_id": 202,
            "plate_text": "HR-26-DK-9921",
            "plate_confidence": 0.95,
            "reid_embedding": [0.1] * 512
        }
        gid2, match_type2, score2, speed = self.matcher.match_detection(det2)
        self.assertEqual(gid1, gid2)
        self.assertEqual(match_type2, "EXACT_PLATE")
        self.assertIsNotNone(speed)

    def test_reid_fallback_when_plate_occluded(self):
        t0 = time.time()
        # Seed consistent normalized vector
        rng = np.random.RandomState(42)
        v = rng.randn(512).astype(np.float32)
        v /= np.linalg.norm(v)
        v_list = v.tolist()

        det1 = {
            "camera_id": "CAM-N-01",
            "timestamp": t0,
            "local_track_id": 11,
            "plate_text": "DL-01-AB-1234",
            "plate_confidence": 0.94,
            "reid_embedding": v_list
        }
        gid1, _, _, _ = self.matcher.match_detection(det1)

        # Vehicle at next camera has occluded/unreadable plate, but identical Re-ID embedding 20s later
        det2 = {
            "camera_id": "CAM-N-02",
            "timestamp": t0 + 20,
            "local_track_id": 22,
            "plate_text": None,
            "plate_confidence": 0.0,
            "reid_embedding": v_list
        }
        gid2, match_type2, score2, _ = self.matcher.match_detection(det2)
        self.assertEqual(gid1, gid2)
        self.assertEqual(match_type2, "REID_FALLBACK")
        self.assertGreaterEqual(score2, 0.72)

    def test_spatiotemporal_speed_check(self):
        t0 = time.time()
        det1 = {
            "camera_id": "CAM-N-01",
            "timestamp": t0,
            "local_track_id": 33,
            "plate_text": "UP-16-XY-4321",
            "plate_confidence": 0.95,
            "reid_embedding": [0.5] * 512
        }
        gid1, _, _, _ = self.matcher.match_detection(det1)

        # Physically impossible hop: 1 km distance in 0.1 seconds (>36,000 km/h)
        det2 = {
            "camera_id": "CAM-N-04",
            "timestamp": t0 + 0.1,
            "local_track_id": 44,
            "plate_text": "UP-16-XY-4321",
            "plate_confidence": 0.95,
            "reid_embedding": [0.5] * 512
        }
        gid2, match_type2, _, _ = self.matcher.match_detection(det2)
        # Should be rejected from previous track due to velocity ceiling and assigned new track
        self.assertNotEqual(gid1, gid2)

if __name__ == "__main__":
    unittest.main()
