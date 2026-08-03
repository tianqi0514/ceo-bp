"""User-facing knowledge-network routes backed by the KWeaver gateway."""

from __future__ import annotations

from typing import Annotated, Literal, Self

from fastapi import APIRouter, Path, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ceobp.kweaver_gateway import (
    BuildReceipt,
    KnowledgeNetwork,
    KWeaverGatewayError,
    KWeaverKnowledgeNetworkGateway,
    ObjectType,
    ObjectTypeField,
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


FieldName = Annotated[
    str,
    Field(min_length=1, max_length=64, pattern=r"^[A-Za-z_][A-Za-z0-9_]*$"),
]


class CreateObjectTypeFieldRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: FieldName
    display_name: str = Field(min_length=1, max_length=120)
    type: Literal["string", "integer", "decimal", "datetime", "boolean"]


class CreateObjectTypeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=40)
    primary_key: FieldName
    display_key: FieldName
    fields: list[CreateObjectTypeFieldRequest] = Field(min_length=1, max_length=50)

    @field_validator("fields")
    @classmethod
    def validate_unique_fields(
        cls,
        fields: list[CreateObjectTypeFieldRequest],
    ) -> list[CreateObjectTypeFieldRequest]:
        names = [field.name for field in fields]
        if len(set(names)) != len(names):
            raise ValueError("Field names must be unique")
        return fields

    @model_validator(mode="after")
    def validate_key_membership(self) -> Self:
        names = {field.name for field in self.fields}
        if self.primary_key not in names or self.display_key not in names:
            raise ValueError("Primary and display keys must be declared fields")
        return self


class ObjectTypePage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ObjectType]


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

    @router.get(
        "/{knowledge_network_id}/object-types",
        response_model=ObjectTypePage,
        summary="列出知识网络中的经营对象类型",
    )
    def list_object_types(knowledge_network_id: KnowledgeNetworkId) -> ObjectTypePage:
        return ObjectTypePage(
            items=required_gateway().list_object_types(knowledge_network_id)
        )

    @router.post(
        "/{knowledge_network_id}/object-types",
        response_model=ObjectType,
        status_code=status.HTTP_201_CREATED,
        summary="创建由平台托管数据集支撑的经营对象类型",
    )
    def create_object_type(
        knowledge_network_id: KnowledgeNetworkId,
        request: CreateObjectTypeRequest,
    ) -> ObjectType:
        return required_gateway().create_object_type(
            knowledge_network_id,
            name=request.name,
            fields=[ObjectTypeField(**field.model_dump()) for field in request.fields],
            primary_keys=[request.primary_key],
            display_key=request.display_key,
        )

    return router
