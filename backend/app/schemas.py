from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Assignment = Literal["REVENUE", "STANDBY", "IBL"]


class PlanItemOut(BaseModel):
    train_id: str
    depot_id: str
    assignment: Assignment
    rank: int
    score: float
    reasons: list[str]
    violations: list[str]


class Relaxation(BaseModel):
    constraint: str
    relax_by: int
    message: str


class PlanOut(BaseModel):
    plan_id: int | None = None
    created_at: datetime | None = None
    service_date: str
    feasible: bool
    items: list[PlanItemOut]
    relaxations: list[Relaxation]
    objective: float
    solve_seconds: float
    weights: dict[str, float]
    weights_source: str = "default"
    data_source: str = "metropt3"
    inputs_loaded: dict[str, bool] = {}
    rules_not_checked: list[str] = []
    goals_not_used: list[str] = []


class GenerateIn(BaseModel):
    weights: dict[str, float] | None = None
    use_learned_weights: bool = True


class Scenario(BaseModel):
    type: Literal["cert_expire", "crews_absent", "critical_job", "required_revenue"]
    train_id: str | None = None
    kind: str | None = None
    count: int | None = None
    value: int | None = None
    description: str | None = None


class SimulateIn(BaseModel):
    scenarios: list[Scenario] = Field(min_length=1)
    weights: dict[str, float] | None = None


class Change(BaseModel):
    train_id: str
    before: str | None
    after: str
    reasons: list[str]


class SimulateOut(BaseModel):
    baseline: PlanOut
    scenario: PlanOut
    changes: list[Change]


class OverrideIn(BaseModel):
    train_id: str
    to_assignment: Assignment
    reason: str = Field(min_length=3)
    plan_id: int | None = None
    supervisor: str = "supervisor"


class OverrideOut(BaseModel):
    id: int
    created_at: datetime
    plan_id: int | None
    train_id: str
    from_assignment: str
    to_assignment: str
    reason: str
    supervisor: str
