from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Config(Base):
    __tablename__ = "config"
    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(String)


class Depot(Base):
    __tablename__ = "depots"
    depot_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)


class Bay(Base):
    __tablename__ = "bays"
    bay_id: Mapped[str] = mapped_column(String, primary_key=True)
    depot_id: Mapped[str] = mapped_column(ForeignKey("depots.depot_id"))
    line: Mapped[int] = mapped_column(Integer)
    position: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String)


class Trainset(Base):
    __tablename__ = "trainsets"
    train_id: Mapped[str] = mapped_column(String, primary_key=True)
    depot_id: Mapped[str] = mapped_column(ForeignKey("depots.depot_id"))
    cars: Mapped[int] = mapped_column(Integer, default=3)
    cumulative_km: Mapped[int] = mapped_column(Integer)
    bay_id: Mapped[str] = mapped_column(String)
    days_since_cleaning: Mapped[int] = mapped_column(Integer)


class Certificate(Base):
    __tablename__ = "certificates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    train_id: Mapped[str] = mapped_column(String, index=True)
    kind: Mapped[str] = mapped_column(String)
    valid_until: Mapped[str] = mapped_column(String)


class JobCard(Base):
    __tablename__ = "job_cards"
    wonum: Mapped[str] = mapped_column(String, primary_key=True)
    assetnum: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String)
    wopriority: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    reportdate: Mapped[str] = mapped_column(String)


class BrandingContract(Base):
    __tablename__ = "branding"
    contract_id: Mapped[str] = mapped_column(String, primary_key=True)
    train_id: Mapped[str] = mapped_column(String, index=True)
    advertiser: Mapped[str] = mapped_column(String)
    min_hours_per_day: Mapped[int] = mapped_column(Integer)
    hours_shortfall_7d: Mapped[int] = mapped_column(Integer)


class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    service_date: Mapped[str] = mapped_column(String)
    feasible: Mapped[bool] = mapped_column(Boolean)
    objective: Mapped[float] = mapped_column(Float)
    solve_seconds: Mapped[float] = mapped_column(Float)
    weights: Mapped[dict] = mapped_column(JSON)
    relaxations: Mapped[list] = mapped_column(JSON)


class PlanItemRow(Base):
    __tablename__ = "plan_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), index=True)
    train_id: Mapped[str] = mapped_column(String)
    depot_id: Mapped[str] = mapped_column(String)
    assignment: Mapped[str] = mapped_column(String)
    rank: Mapped[int] = mapped_column(Integer)
    score: Mapped[float] = mapped_column(Float)
    reasons: Mapped[list] = mapped_column(JSON)
    violations: Mapped[list] = mapped_column(JSON)


class Override(Base):
    __tablename__ = "overrides"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    plan_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    train_id: Mapped[str] = mapped_column(String)
    from_assignment: Mapped[str] = mapped_column(String)
    to_assignment: Mapped[str] = mapped_column(String)
    reason: Mapped[str] = mapped_column(String)
    supervisor: Mapped[str] = mapped_column(String, default="supervisor")
    features: Mapped[dict] = mapped_column(JSON)
