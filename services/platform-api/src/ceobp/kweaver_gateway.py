"""Anti-corruption gateway for the admitted KWeaver knowledge-network APIs."""

from __future__ import annotations

import builtins
from collections.abc import Callable
from typing import Literal, TypeVar

from kweaver import KWeaverClient, NoAuth  # type: ignore[import-untyped]
from kweaver._errors import (  # type: ignore[import-untyped]
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    KWeaverError,
    NetworkError,
    NotFoundError,
    ServerError,
    ValidationError,
)
from kweaver.types import (  # type: ignore[import-untyped]
    KnowledgeNetwork as UpstreamKnowledgeNetwork,
)
from pydantic import BaseModel, ConfigDict

from ceobp.settings import Settings

_Result = TypeVar("_Result")


class KnowledgeNetworkStatistics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    object_types: int = 0
    relation_types: int = 0
    action_types: int = 0
    concept_groups: int = 0


class KnowledgeNetwork(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    description: str | None = None
    tags: list[str]
    statistics: KnowledgeNetworkStatistics | None = None


class BuildReceipt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    knowledge_network_id: str
    state: Literal["accepted"] = "accepted"


class KWeaverGatewayError(RuntimeError):
    """Stable error exposed to the CEO-BP application layer."""

    def __init__(
        self,
        code: str,
        message: str,
        *,
        retryable: bool,
        upstream_trace_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable
        self.upstream_trace_id = upstream_trace_id


class KWeaverKnowledgeNetworkGateway:
    """Translate the official SDK model into CEO-BP-owned contracts."""

    def __init__(self, client: KWeaverClient) -> None:
        self._client = client

    @classmethod
    def from_settings(cls, settings: Settings) -> KWeaverKnowledgeNetworkGateway:
        if not settings.kweaver_configured:
            raise ValueError("KWeaver is not configured")
        common = {
            "base_url": settings.kweaver_base_url,
            "business_domain": settings.kweaver_business_domain,
            "timeout": settings.kweaver_timeout_seconds,
            "tls_insecure": settings.kweaver_tls_insecure,
        }
        if settings.kweaver_no_auth:
            client = KWeaverClient(auth=NoAuth(), **common)
        else:
            token = settings.kweaver_token
            authorization = token if " " in token else f"Bearer {token}"
            client = KWeaverClient(token=authorization, **common)
        return cls(client)

    def close(self) -> None:
        self._client.close()

    def list(
        self,
        *,
        name_pattern: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> builtins.list[KnowledgeNetwork]:
        items = self._call(
            lambda: self._client.knowledge_networks.list(
                name_pattern=name_pattern,
                offset=offset,
                limit=limit,
            )
        )
        return [_map_network(item) for item in items]

    def get(self, knowledge_network_id: str) -> KnowledgeNetwork:
        item = self._call(
            lambda: self._client.knowledge_networks.get(
                knowledge_network_id,
                include_statistics=True,
            )
        )
        return _map_network(item)

    def create(
        self,
        name: str,
        *,
        description: str | None = None,
        tags: builtins.list[str] | None = None,
    ) -> KnowledgeNetwork:
        item = self._call(
            lambda: self._client.knowledge_networks.create(
                name,
                description=description,
                tags=tags,
            )
        )
        return _map_network(item)

    def build(self, knowledge_network_id: str) -> BuildReceipt:
        self._call(lambda: self._client.knowledge_networks.build(knowledge_network_id))
        return BuildReceipt(knowledge_network_id=knowledge_network_id)

    def _call(self, operation: Callable[[], _Result]) -> _Result:
        try:
            return operation()
        except KWeaverError as exc:
            raise _translate_error(exc) from exc


def _map_network(item: UpstreamKnowledgeNetwork) -> KnowledgeNetwork:
    statistics = None
    if item.statistics is not None:
        statistics = KnowledgeNetworkStatistics(
            object_types=item.statistics.object_types_total,
            relation_types=item.statistics.relation_types_total,
            action_types=item.statistics.action_types_total,
            concept_groups=item.statistics.concept_groups_total,
        )
    return KnowledgeNetwork(
        id=item.id,
        name=item.name,
        description=item.comment,
        tags=list(item.tags),
        statistics=statistics,
    )


def _translate_error(exc: KWeaverError) -> KWeaverGatewayError:
    if isinstance(exc, AuthenticationError):
        return KWeaverGatewayError(
            "KWEAVER_AUTHENTICATION_FAILED",
            "KWeaver authentication failed",
            retryable=False,
            upstream_trace_id=exc.trace_id,
        )
    if isinstance(exc, AuthorizationError):
        code, message, retryable = (
            "KWEAVER_ACCESS_DENIED",
            "KWeaver access was denied",
            False,
        )
    elif isinstance(exc, NotFoundError):
        code, message, retryable = (
            "KNOWLEDGE_NETWORK_NOT_FOUND",
            "Knowledge network was not found",
            False,
        )
    elif isinstance(exc, ValidationError):
        code, message, retryable = (
            "KWEAVER_VALIDATION_FAILED",
            "KWeaver rejected the request",
            False,
        )
    elif isinstance(exc, ConflictError):
        code, message, retryable = (
            "KWEAVER_CONFLICT",
            "KWeaver reported a conflicting resource",
            False,
        )
    elif isinstance(exc, (NetworkError, ServerError)):
        code, message, retryable = (
            "KWEAVER_UNAVAILABLE",
            "KWeaver is temporarily unavailable",
            True,
        )
    else:
        code, message, retryable = (
            "KWEAVER_REQUEST_FAILED",
            "KWeaver request failed",
            False,
        )
    return KWeaverGatewayError(
        code,
        message,
        retryable=retryable,
        upstream_trace_id=exc.trace_id,
    )
