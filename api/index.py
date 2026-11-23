"""Vercel entry point: serves the FastAPI backend as one Python function.

Vercel's filesystem is read-only except /tmp, so the SQLite database lives there. It is created fresh
on each cold start: plans and overrides are kept only while the instance stays warm.
"""
import os
import sys
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/metrosched.db")
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.main import app  # noqa: E402,F401
