"""Transport schemas for the system foundation endpoints."""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


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


class OverviewResponse(StrictModel):
    info: SystemInfo
    health: HealthResponse
    capabilities: list[Capability]
