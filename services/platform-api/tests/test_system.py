from fastapi.testclient import TestClient

from ceobp.main import create_app
from ceobp.settings import Settings


def test_root_describes_foundation() -> None:
    client = TestClient(create_app(Settings(environment="test", build_sha="abc123")))

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
