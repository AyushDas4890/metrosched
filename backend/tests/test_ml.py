import random

from ml.learner import MIN_OVERRIDES, features, learn_weights
from optimizer.model import DEFAULT_WEIGHTS


def test_fallback_below_threshold():
    w, info = learn_weights([{"features": {"branding_need": 1}, "to_assignment": "REVENUE"}] * (MIN_OVERRIDES - 1))
    assert w == DEFAULT_WEIGHTS and info["source"] == "default"


def test_learns_branding_preference(snap25):
    rng = random.Random(1)
    overrides = []
    for _ in range(60):
        t = rng.choice(snap25.trains)
        f = features(snap25, t)
        f["branding_need"] = rng.choice([0, 0, 20, 25])
        overrides.append({"features": f, "to_assignment": "REVENUE" if f["branding_need"] else "STANDBY"})
    w, info = learn_weights(overrides)
    assert info["source"] == "learned"
    assert w["branding"] > DEFAULT_WEIGHTS["branding"]
