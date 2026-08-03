"""Anti-corruption gateway for the admitted KWeaver knowledge-network APIs."""

from __future__ import annotations

import builtins
import secrets
from collections.abc import Callable
from typing import Literal, TypeVar, cast

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
from kweaver.types import (
    ObjectType as UpstreamObjectType,
)
from kweaver.types import (
    Property,
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


ObjectFieldType = Literal["string", "integer", "decimal", "datetime", "boolean"]


class ObjectTypeField(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    display_name: str
    type: ObjectFieldType


class ObjectType(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    knowledge_network_id: str
    name: str
    primary_keys: builtins.list[str]
    display_key: str
    fields: builtins.list[ObjectTypeField]


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

    def __init__(
        self,
        client: KWeaverClient,
        *,
        vega_client: KWeaverClient | None = None,
        managed_catalog_id: str = "ceobp_business_catalog",
    ) -> None:
        self._client = client
        self._vega_client = vega_client
        self._managed_catalog_id = managed_catalog_id

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

        vega_common = {
            **common,
            "base_url": settings.kweaver_vega_base_url or settings.kweaver_base_url,
        }
        if settings.kweaver_no_auth:
            vega_client = KWeaverClient(auth=NoAuth(), **vega_common)
        else:
            vega_client = KWeaverClient(token=authorization, **vega_common)
        return cls(
            client,
            vega_client=vega_client,
            managed_catalog_id=settings.kweaver_managed_catalog_id,
        )

    def close(self) -> None:
        self._client.close()
        if self._vega_client is not None and self._vega_client is not self._client:
            self._vega_client.close()

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
        if item.name:
            return _map_network(item)
        if not item.id:
            raise KWeaverGatewayError(
                "KWEAVER_INVALID_RESPONSE",
                "KWeaver returned an invalid create response",
                retryable=False,
            )

        if description is not None:
            def persist_comment() -> None:
                try:
                    self._client.knowledge_networks.update(
                        item.id,
                        name=name,
                        comment=description,
                        tags=tags or [],
                        branch="main",
                    )
                except AttributeError as exc:
                    if not _is_empty_sdk_response_error(exc):
                        raise

            self._call(persist_comment)

        item = self._call(
            lambda: self._client.knowledge_networks.get(
                item.id,
                include_statistics=True,
            )
        )
        return _map_network(item)

    def build(self, knowledge_network_id: str) -> BuildReceipt:
        self._call(lambda: self._client.knowledge_networks.build(knowledge_network_id))
        return BuildReceipt(knowledge_network_id=knowledge_network_id)

    def list_object_types(
        self,
        knowledge_network_id: str,
    ) -> builtins.list[ObjectType]:
        items = self._call(
            lambda: self._client.object_types.list(knowledge_network_id)
        )
        return [_map_object_type(item) for item in items]

    def create_object_type(
        self,
        knowledge_network_id: str,
        *,
        name: str,
        fields: builtins.list[ObjectTypeField],
        primary_keys: builtins.list[str],
        display_key: str,
    ) -> ObjectType:
        if self._vega_client is None:
            raise KWeaverGatewayError(
                "KWEAVER_VEGA_NOT_CONFIGURED",
                "KWeaver data resource integration is not configured",
                retryable=False,
            )
        vega_client = self._vega_client

        resource_name = f"ceobp-object-{knowledge_network_id[:24]}-{secrets.token_hex(6)}"
        schema = [field.model_dump() for field in fields]
        resource = self._call(
            lambda: vega_client.resources.create(
                resource_name,
                self._managed_catalog_id,
                category="dataset",
                fields=schema,
            )
        )

        try:
            item = self._call(
                lambda: self._client.object_types.create(
                    knowledge_network_id,
                    name=name,
                    resource_id=resource.id,
                    primary_keys=primary_keys,
                    display_key=display_key,
                    properties=[
                        Property(
                            name=field.name,
                            display_name=field.display_name,
                            type=field.type,
                        )
                        for field in fields
                    ],
                )
            )
        except KWeaverGatewayError:
            self._remove_managed_resource(resource.id)
            raise

        if not item.id:
            self._remove_managed_resource(resource.id)
            raise KWeaverGatewayError(
                "KWEAVER_INVALID_RESPONSE",
                "KWeaver returned an invalid object type response",
                retryable=False,
            )
        if not item.name:
            item = self._call(
                lambda: self._client.object_types.get(
                    knowledge_network_id,
                    item.id,
                )
            )
        return _map_object_type(item)

    def _remove_managed_resource(self, resource_id: str) -> None:
        if self._vega_client is None:
            return
        vega_client = self._vega_client
        try:
            self._call(lambda: vega_client.resources.delete(resource_id))
        except KWeaverGatewayError:
            # Keep the original object-creation error; cleanup can be retried by ops.
            return

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


def _map_object_type(item: UpstreamObjectType) -> ObjectType:
    return ObjectType(
        id=item.id,
        knowledge_network_id=item.kn_id,
        name=item.name,
        primary_keys=list(item.primary_keys),
        display_key=item.display_key,
        fields=[
            ObjectTypeField(
                name=field.name,
                display_name=field.display_name or field.name,
                type=_owned_field_type(field.type),
            )
            for field in item.properties
        ],
    )


def _owned_field_type(raw_type: str) -> ObjectFieldType:
    if raw_type in {"integer", "decimal", "datetime", "boolean"}:
        return cast(ObjectFieldType, raw_type)
    return "string"


def _is_empty_sdk_response_error(exc: AttributeError) -> bool:
    """Recognize the locked SDK parsing a successful empty update response."""

    return getattr(exc, "obj", object()) is None and getattr(exc, "name", None) == "get"


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
