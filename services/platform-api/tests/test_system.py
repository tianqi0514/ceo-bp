from pathlib import Path

from fastapi.testclient import TestClient

from ceobp.main import create_app
from ceobp.settings import Settings


def test_root_describes_foundation() -> None:
    client = TestClient(
        create_app(Settings(environment="test", build_sha="abc123", static_dir="/not-found"))
    )

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "foundation"
    assert response.json()["links"]["health"] == "/health/ready"


def test_health_endpoints() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    live = client.get("/health/live")
    ready = client.get("/health/ready")

    assert live.status_code == 200
    assert live.json()["status"] == "ok"
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"


def test_static_console_is_served_when_built(tmp_path: Path) -> None:
    index = tmp_path / "index.html"
    index.write_text("<html><body>CEO-BP Console</body></html>", encoding="utf-8")
    client = TestClient(create_app(Settings(environment="test", static_dir=str(tmp_path))))

    response = client.get("/")

    assert response.status_code == 200
    assert "CEO-BP Console" in response.text
    assert response.headers["Content-Security-Policy"].startswith("default-src 'self'")


def test_api_docs_allow_only_the_swagger_asset_origin() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))

    response = client.get("/docs")

    assert response.status_code == 200
    policy = response.headers["Content-Security-Policy"]
    assert "https://cdn.jsdelivr.net" in policy
    assert "https://fastapi.tiangolo.com" in policy


def test_system_info_only_exposes_non_secret_build_data() -> None:
    client = TestClient(create_app(Settings(environment="integration", build_sha="deadbeef")))

    response = client.get("/api/v1/system/info")

    assert response.status_code == 200
    assert response.json()["environment"] == "integration"
    assert response.json()["build_sha"] == "deadbeef"
    assert "password" not in response.text.lower()
    assert "secret" not in response.text.lower()


def test_capability_status_is_explicit() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.get("/api/v1/system/capabilities")

    assert response.status_code == 200
    items = response.json()["items"]
    assert {item["status"] for item in items} == {"foundation", "planned"}
    assert any(item["id"] == "knowledge" and item["status"] == "planned" for item in items)


def test_overview_aggregates_system_health_and_capabilities() -> None:
    client = TestClient(
        create_app(Settings(environment="demo", build_sha="fullstack", static_dir="/not-found"))
    )

    response = client.get("/api/v1/overview")

    assert response.status_code == 200
    body = response.json()
    assert body["info"]["environment"] == "demo"
    assert body["info"]["build_sha"] == "fullstack"
    assert body["health"]["status"] == "ready"
    assert len(body["capabilities"]) == 5
    assert body["uptime_seconds"] >= 0
    assert body["started_at"].endswith("Z")
    assert body["server_time"].endswith("Z")
    assert {endpoint["path"] for endpoint in body["endpoints"]} == {
        "/",
        "/health/ready",
        "/api/v1/overview",
        "/docs",
    }


def test_request_id_is_preserved_when_safe() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.get("/health/live", headers={"X-Request-ID": "req-2026:0001"})

    assert response.headers["X-Request-ID"] == "req-2026:0001"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Cache-Control"] == "no-store"


def test_unsafe_request_id_is_replaced() -> None:
    client = TestClient(create_app(Settings(environment="test")))

    response = client.get("/health/live", headers={"X-Request-ID": "unsafe value"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "unsafe value"
