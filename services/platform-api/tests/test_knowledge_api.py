import json

import httpx
from fastapi.testclient import TestClient
from kweaver import KWeaverClient

from ceobp.kweaver_gateway import KWeaverKnowledgeNetworkGateway
from ceobp.main import create_app
from ceobp.settings import Settings


def _client(
    handler: httpx.MockTransport,
) -> tuple[TestClient, KWeaverKnowledgeNetworkGateway]:
    upstream = KWeaverClient(
        "https://kweaver.internal",
        token="Bearer service-token",
        transport=handler,
    )
    gateway = KWeaverKnowledgeNetworkGateway(upstream)
    app = create_app(
        Settings(environment="test", static_dir="/not-found"),
        knowledge_network_gateway=gateway,
    )
    return TestClient(app), gateway


def test_knowledge_network_routes_execute_real_sdk_contracts() -> None:
    calls: list[tuple[str, str]] = []

    def handle(request: httpx.Request) -> httpx.Response:
        calls.append((request.method, request.url.path))
        if request.method == "GET" and request.url.path.endswith("knowledge-networks"):
            return httpx.Response(200, json={"entries": [{"id": "kn-1", "name": "经营网络"}]})
        if request.method == "GET":
            return httpx.Response(
                200,
                json={
                    "id": "kn-1",
                    "name": "经营网络",
                    "statistics": {"object_types_total": 2},
                },
            )
        body = json.loads(request.content)
        if request.url.path.endswith("/jobs"):
            assert body["job_type"] == "full"
            return httpx.Response(202)
        return httpx.Response(201, json={"id": "kn-new", "name": body["name"]})

    client, gateway = _client(httpx.MockTransport(handle))
    try:
        page = client.get("/api/v1/knowledge-networks?limit=10")
        detail = client.get("/api/v1/knowledge-networks/kn-1")
        created = client.post(
            "/api/v1/knowledge-networks",
            json={"name": "供应链网络", "description": "风险分析", "tags": ["风险"]},
        )
        build = client.post("/api/v1/knowledge-networks/kn-new/builds")
    finally:
        gateway.close()

    assert page.status_code == 200
    assert page.json() == {
        "items": [
            {
                "id": "kn-1",
                "name": "经营网络",
                "description": None,
                "tags": [],
                "statistics": None,
            }
        ],
        "offset": 0,
        "limit": 10,
    }
    assert detail.json()["statistics"]["object_types"] == 2
    assert created.status_code == 201
    assert created.json()["id"] == "kn-new"
    assert build.status_code == 202
    assert build.json() == {"knowledge_network_id": "kn-new", "state": "accepted"}
    assert calls == [
        ("GET", "/api/ontology-manager/v1/knowledge-networks"),
        ("GET", "/api/ontology-manager/v1/knowledge-networks/kn-1"),
        ("POST", "/api/ontology-manager/v1/knowledge-networks"),
        ("POST", "/api/ontology-manager/v1/knowledge-networks/kn-new/jobs"),
    ]


def test_unconfigured_integration_returns_explicit_error_without_fake_data() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))

    response = client.get(
        "/api/v1/knowledge-networks",
        headers={"X-Request-ID": "req-kweaver-not-configured"},
    )

    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "KWEAVER_NOT_CONFIGURED",
            "message": "KWeaver integration is not configured",
            "retryable": False,
        },
        "request_id": "req-kweaver-not-configured",
    }


def test_upstream_failure_is_sanitized_for_api_consumers() -> None:
    client, gateway = _client(
        httpx.MockTransport(
            lambda _: httpx.Response(
                503,
                json={"message": "password=secret database failure"},
            )
        )
    )
    try:
        response = client.get("/api/v1/knowledge-networks")
    finally:
        gateway.close()

    assert response.status_code == 503
    assert response.json()["error"] == {
        "code": "KWEAVER_UNAVAILABLE",
        "message": "KWeaver is temporarily unavailable",
        "retryable": True,
    }
    assert "secret" not in response.text


def test_knowledge_requests_reject_ambiguous_or_invalid_inputs() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))

    duplicate_tags = client.post(
        "/api/v1/knowledge-networks",
        json={"name": "经营网络", "tags": ["经营", "经营"]},
    )
    invalid_id = client.get("/api/v1/knowledge-networks/not/a/valid/id")
    excessive_limit = client.get("/api/v1/knowledge-networks?limit=101")

    assert duplicate_tags.status_code == 422
    assert invalid_id.status_code == 404
    assert excessive_limit.status_code == 422
