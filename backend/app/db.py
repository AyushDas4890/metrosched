import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DEFAULT_URL = f"sqlite:///{Path(__file__).resolve().parents[1] / 'metrosched.db'}"


class Base(DeclarativeBase):
    pass


def make_engine(url: str | None = None):
    url = url or os.getenv("DATABASE_URL", DEFAULT_URL)
    kw = {"connect_args": {"check_same_thread": False}} if url.startswith("sqlite") else {}
    return create_engine(url, **kw)


def make_session_factory(engine):
    Base.metadata.create_all(engine)
    return sessionmaker(engine, expire_on_commit=False)
