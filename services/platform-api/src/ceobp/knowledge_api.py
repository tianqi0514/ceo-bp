"""User-facing knowledge-network routes backed by the KWeaver gateway."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

from ceobp.kweaver_gateway import (
    BuildReceipt,
    KnowledgeNetwork,
    KWeaverGatewayError,
    KWeaverKnowledgeNetworkGateway,
)

KnowledgeNetworkId = Annotated[
    str,
    Path(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$"),
]


class CreateKnowledgeNetworkRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    tags: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, tags: list[str]) -> list[str]:
        cleaned = [tag.strip() for tag in tags]
        if any(not tag or len(tag) > 40 for tag in cleaned):
            raise ValueError("Tags must contain between 1 and 40 characters")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Tags must be unique")
        return cleaned


class KnowledgeNetworkPage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[KnowledgeNetwork]
    offset: int
    limit: int


def create_knowledge_router(
    gateway: KWeaverKnowledgeNetworkGateway | None,
) -> APIRouter:
    router = APIRouter(prefix="/api/v1/knowledge-networks", tags=["knowledge networks"])

    def required_gateway() -> KWeaverKnowledgeNetworkGateway:
        if gateway is None:
            raise KWeaverGatewayError(
                "KWEAVER_NOT_CONFIGURED",
                "KWeaver integration is not configured",
                retryable=False,
            )
        return gateway

    @router.get("", response_model=KnowledgeNetworkPage, summary="列出知识网络")
    def list_knowledge_networks(
        name_pattern: Annotated[str | None, Query(min_length=1, max_length=120)] = None,
        offset: Annotated[int, Query(ge=0)] = 0,
        limit: Annotated[int, Query(ge=1, le=100)] = 50,
    ) -> KnowledgeNetworkPage:
        items = required_gateway().list(
            name_pattern=name_pattern,
            offset=offset,
            limit=limit,
        )
        return KnowledgeNetworkPage(items=items, offset=offset, limit=limit)

    @router.get(
        "/{knowledge_network_id}",
        response_model=KnowledgeNetwork,
        summary="查看知识网络及模式统计",
    )
    def get_knowledge_network(knowledge_network_id: KnowledgeNetworkId) -> KnowledgeNetwork:
        return required_gateway().get(knowledge_network_id)

    @router.post(
        "",
        response_model=KnowledgeNetwork,
        status_code=status.HTTP_201_CREATED,
        summary="创建知识网络",
    )
    def create_knowledge_network(
        request: CreateKnowledgeNetworkRequest,
    ) -> KnowledgeNetwork:
        return required_gateway().create(
            request.name,
            description=request.description,
            tags=request.tags,
        )

    @router.post(
        "/{knowledge_network_id}/builds",
        response_model=BuildReceipt,
        status_code=status.HTTP_202_ACCEPTED,
        summary="触发知识网络全量构建",
    )
    def build_knowledge_network(knowledge_network_id: KnowledgeNetworkId) -> BuildReceipt:
        return required_gateway().build(knowledge_network_id)

    return router
