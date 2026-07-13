import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from services.recomender_service import recommend_places_service


class RecommenderFallbackTests(unittest.TestCase):
    def test_returns_fallback_recommendations_for_beach_queries(self):
        result = recommend_places_service("surfing beach places in Sri Lanka", top_n=3)

        self.assertIn("recommendations", result)
        self.assertGreaterEqual(len(result["recommendations"]), 1)

        names = [place["place_name"] for place in result["recommendations"]]
        self.assertTrue(any("Mirissa" in name or "Beach" in name for name in names))


if __name__ == "__main__":
    unittest.main()
