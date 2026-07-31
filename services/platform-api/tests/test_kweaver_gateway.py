import json

import httpx
import pytest
from kweaver import KWeaverClient

from ceobp.kweaver_gateway import KWeaverGatewayError, KWeaverKnowledgeNetworkGateway
from ceobp.settings import Settings


def _gateway(handler: httpx.MockTransport) -> KWeaverKnowledgeNetworkGateway:
    client = KWeaverClient(
        "https://kweaver.internal",
        token="Bearer service-token",
        business_domain="bd_ceobp",
        timeout=1,
        transport=handler,
    )
    return KWeaverKnowledgeNetworkGateway(client)


def test_list_uses_official_sdk_contract_and_maps_owned_dto() -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/ontology-manager/v1/knowledge-networks"
        assert request.url.params["name_pattern"] == "经营"
        assert request.url.params["offset"] == "10"
        assert request.url.params["limit"] == "20"
        assert request.headers["authorization"] == "Bearer service-token"
        assert request.headers["x-business-domain"] == "bd_ceobp"
        return httpx.Response(
            200,
            json={
                "entries": [
                    {
                        "id": "kn-1",
                        "name": "经营知识网络",
                        "description": "统一经营口径",
                        "tags": ["经营"],
                    }
                ]
            },
        )

    gateway = _gateway(httpx.MockTransport(handle))
    try:
        items = gateway.list(name_pattern="经营", offset=10, limit=20)
    finally:
        gateway.close()

    assert [item.model_dump() for item in items] == [
        {
            "id": "kn-1",
            "name": "经营知识网络",
            "description": "统一经营口径",
            "tags": ["经营"],
            "statistics": None,
        }
    ]


def test_get_maps_upstream_statistics_names() -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        assert request.url.params["include_statistics"] == "true"
        return httpx.Response(
            200,
            json={
                "id": "kn-2",
                "name": "销售网络",
                "tags": [],
                "statistics": {
                    "object_types_total": 3,
                    "relation_types_total": 2,
                    "action_types_total": 1,
                    "concept_groups_total": 4,
                },
            },
        )

    gateway = _gateway(httpx.MockTransport(handle))
    try:
        item = gateway.get("kn-2")
    finally:
        gateway.close()

    assert item.statistics is not None
    assert item.statistics.model_dump() == {
        "object_types": 3,
        "relation_types": 2,
        "action_types": 1,
        "concept_groups": 4,
    }


def test_create_and_build_have_explicit_upstream_side_effects() -> None:
    requests: list[tuple[str, str, dict[str, object]]] = []

    def handle(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        requests.append((request.method, request.url.path, body))
        if request.url.path.endswith("/jobs"):
            return httpx.Response(202)
        return httpx.Response(
            201,
            json={"id": "kn-new", "name": body["name"], "tags": body["tags"]},
        )

    gateway = _gateway(httpx.MockTransport(handle))
    try:
        network = gateway.create("供应链", description="风险关联", tags=["经营", "风险"])
        receipt = gateway.build(network.id)
    finally:
        gateway.close()

    assert network.id == "kn-new"
    assert receipt.model_dump() == {
        "knowledge_network_id": "kn-new",
        "state": "accepted",
    }
    assert requests[0] == (
        "POST",
        "/api/ontology-manager/v1/knowledge-networks",
        {
            "name": "供应链",
            "branch": "main",
            "description": "风险关联",
            "tags": ["经营", "风险"],
        },
    )
    assert requests[1][0:2] == (
        "POST",
        "/api/ontology-manager/v1/knowledge-networks/kn-new/jobs",
    )
    assert requests[1][2]["job_type"] == "full"


def test_upstream_error_is_sanitized_and_marked_retryable() -> None:
    def handle(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            503,
            json={
                "message": "database 10.0.0.8 password=secret unavailable",
                "trace_id": "upstream-trace",
            },
        )

    gateway = _gateway(httpx.MockTransport(handle))
    try:
        with pytest.raises(KWeaverGatewayError) as captured:
            gateway.list()
    finally:
        gateway.close()

    assert captured.value.code == "KWEAVER_UNAVAILABLE"
    assert captured.value.retryable is True
    assert captured.value.upstream_trace_id == "upstream-trace"
    assert "secret" not in captured.value.message


@pytest.mark.parametrize(
    ("status", "expected_code", "retryable"),
    [
        (401, "KWEAVER_AUTHENTICATION_FAILED", False),
        (403, "KWEAVER_ACCESS_DENIED", False),
        (404, "KNOWLEDGE_NETWORK_NOT_FOUND", False),
        (400, "KWEAVER_VALIDATION_FAILED", False),
        (409, "KWEAVER_CONFLICT", False),
        (418, "KWEAVER_REQUEST_FAILED", False),
    ],
)
def test_upstream_errors_are_mapped_to_stable_codes(
    status: int,
    expected_code: str,
    retryable: bool,
) -> None:
    gateway = _gateway(
        httpx.MockTransport(
            lambda _: httpx.Response(status, json={"message": "upstream detail"})
        )
    )
    try:
        with pytest.raises(KWeaverGatewayError) as captured:
            gateway.get("missing")
    finally:
        gateway.close()

    assert captured.value.code == expected_code
    assert captured.value.retryable is retryable


def test_settings_require_explicit_safe_kweaver_authentication() -> None:
    with pytest.raises(ValueError, match=r"between 0\.1 and 60"):
        Settings(kweaver_timeout_seconds=0)
    with pytest.raises(ValueError, match="token or explicit no-auth"):
        Settings(kweaver_base_url="https://kweaver.internal")
    with pytest.raises(ValueError, match="mutually exclusive"):
        Settings(
            kweaver_base_url="https://kweaver.internal",
            kweaver_token="secret-token",
            kweaver_no_auth=True,
        )
    with pytest.raises(ValueError, match="requires authentication"):
        Settings(
            environment="production",
            kweaver_base_url="https://kweaver.internal",
            kweaver_no_auth=True,
        )
    with pytest.raises(ValueError, match="base URL is required"):
        Settings(kweaver_token="secret-token")

    settings = Settings(
        kweaver_base_url="https://kweaver.internal",
        kweaver_token="secret-token",
    )
    assert settings.kweaver_configured is True
    assert "secret-token" not in repr(settings)


def test_gateway_factory_supports_explicit_token_and_development_no_auth() -> None:
    token_gateway = KWeaverKnowledgeNetworkGateway.from_settings(
        Settings(
            kweaver_base_url="https://kweaver.internal",
            kweaver_token="raw-token",
        )
    )
    no_auth_gateway = KWeaverKnowledgeNetworkGateway.from_settings(
        Settings(
            kweaver_base_url="https://kweaver.internal",
            kweaver_no_auth=True,
        )
    )
    token_gateway.close()
    no_auth_gateway.close()

    with pytest.raises(ValueError, match="not configured"):
        KWeaverKnowledgeNetworkGateway.from_settings(Settings())


def test_settings_parse_environment_without_exposing_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("CEO_BP_KWEAVER_BASE_URL", "https://kweaver.internal/")
    monkeypatch.setenv("CEO_BP_KWEAVER_TOKEN", "raw-token")
    monkeypatch.setenv("CEO_BP_KWEAVER_BUSINESS_DOMAIN", "bd_finance")
    monkeypatch.setenv("CEO_BP_KWEAVER_TIMEOUT_SECONDS", "12.5")
    monkeypatch.setenv("CEO_BP_KWEAVER_TLS_INSECURE", "yes")

    settings = Settings.from_environment()

    assert settings.kweaver_base_url == "https://kweaver.internal"
    assert settings.kweaver_business_domain == "bd_finance"
    assert settings.kweaver_timeout_seconds == 12.5
    assert settings.kweaver_tls_insecure is True

    monkeypatch.setenv("CEO_BP_KWEAVER_TLS_INSECURE", "sometimes")
    with pytest.raises(ValueError, match="must be a boolean"):
        Settings.from_environment()
