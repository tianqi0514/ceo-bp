"""Transport schemas for the system foundation endpoints."""

import math
from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ServiceLinks(StrictModel):
    openapi: str
    docs: str
    health: str


class ServiceRoot(StrictModel):
    product: str
    service: str
    version: str
    status: Literal["foundation"]
    links: ServiceLinks


class HealthResponse(StrictModel):
    status: Literal["ok", "ready"]
    service: str
    version: str


class SystemInfo(StrictModel):
    product: str
    service: str
    version: str
    environment: str
    build_sha: str


class Capability(StrictModel):
    id: str
    name: str
    status: Literal["foundation", "planned"]
    target_phase: str


class CapabilityList(StrictModel):
    items: list[Capability]


class EndpointInfo(StrictModel):
    method: Literal["GET"]
    path: str
    name: str


class OverviewResponse(StrictModel):
    info: SystemInfo
    health: HealthResponse
    capabilities: list[Capability]
    started_at: datetime
    server_time: datetime
    uptime_seconds: int
    endpoints: list[EndpointInfo]


class DecisionCriterion(StrictModel):
    id: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(min_length=1, max_length=60)
    weight: float = Field(gt=0, le=100, allow_inf_nan=False)
    direction: Literal["benefit", "cost"]


class DecisionOption(StrictModel):
    id: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(min_length=1, max_length=80)
    scores: dict[str, float]


class DecisionAnalysisRequest(StrictModel):
    title: str = Field(min_length=3, max_length=120)
    objective: str = Field(default="", max_length=500)
    criteria: list[DecisionCriterion] = Field(min_length=2, max_length=8)
    options: list[DecisionOption] = Field(min_length=2, max_length=6)

    @model_validator(mode="after")
    def validate_matrix(self) -> Self:
        criterion_ids = [criterion.id for criterion in self.criteria]
        option_ids = [option.id for option in self.options]
        if len(set(criterion_ids)) != len(criterion_ids):
            raise ValueError("评价维度 ID 不得重复")
        if len({criterion.name for criterion in self.criteria}) != len(self.criteria):
            raise ValueError("评价维度名称不得重复")
        if len(set(option_ids)) != len(option_ids):
            raise ValueError("备选方案 ID 不得重复")
        if len({option.name for option in self.options}) != len(self.options):
            raise ValueError("备选方案名称不得重复")

        expected_scores = set(criterion_ids)
        for option in self.options:
            if set(option.scores) != expected_scores:
                raise ValueError(f"方案“{option.name}”必须填写全部评价维度")
            if any(
                not math.isfinite(score) or score < 0 or score > 100
                for score in option.scores.values()
            ):
                raise ValueError("方案评分必须在 0 到 100 之间")
        return self


class CriterionContribution(StrictModel):
    criterion_id: str
    criterion_name: str
    raw_score: float
    adjusted_score: float
    weighted_points: float


class RankedOption(StrictModel):
    option_id: str
    option_name: str
    rank: int
    score: float
    contributions: list[CriterionContribution]
    weaknesses: list[str]


class DecisionAnalysisResponse(StrictModel):
    title: str
    recommended_option_id: str
    ranking: list[RankedOption]
    score_gap: float
    stability: Literal["stable", "sensitive"]
    sensitive_criteria: list[str]
    warnings: list[str]
    methodology: str
