import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "data"))

from generator import generate  # noqa: E402
from optimizer.snapshot import FleetSnapshot  # noqa: E402


@pytest.fixture
def data25():
    return generate(25, 1, 471)


@pytest.fixture
def snap25(data25):
    return FleetSnapshot.from_dict(data25)
