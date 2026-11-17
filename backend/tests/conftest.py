import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from fixture_data import generate  # noqa: E402  (test-only synthetic fixture)
from optimizer.snapshot import FleetSnapshot  # noqa: E402


@pytest.fixture
def data25():
    return generate(25, 1, 471)


@pytest.fixture
def snap25(data25):
    return FleetSnapshot.from_dict(data25)


@pytest.fixture
def snap25_apu(data25):
    """The seeded fleet as the API sees it: with real MetroPT-3 compressor risk attached."""
    from ml.apu_risk import assign_slices
    data25["apu"] = assign_slices([t["train_id"] for t in data25["trainsets"]])
    return FleetSnapshot.from_dict(data25)
