from fastapi.testclient import TestClient

from ceobp.main import create_app
from ceobp.settings import Settings


def _request() -> dict[str, object]:
    return {
        "title": "选择区域市场进入方案",
        "objective": "兼顾增长空间与进入成本",
        "criteria": [
            {"id": "growth", "name": "增长潜力", "weight": 60, "direction": "benefit"},
            {"id": "cost", "name": "进入成本", "weight": 40, "direction": "cost"},
        ],
        "options": [
            {"id": "a", "name": "方案 A", "scores": {"growth": 80, "cost": 70}},
            {"id": "b", "name": "方案 B", "scores": {"growth": 60, "cost": 20}},
        ],
    }


def test_decision_analysis_ranks_options_and_explains_cost_direction() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))

    response = client.post("/api/v1/decisions/analyze", json=_request())

    assert response.status_code == 200
    body = response.json()
    assert body["recommended_option_id"] == "b"
    assert [(item["option_name"], item["score"]) for item in body["ranking"]] == [
        ("方案 B", 68.0),
        ("方案 A", 60.0),
    ]
    assert body["score_gap"] == 8.0
    assert body["stability"] == "stable"
    assert body["sensitive_criteria"] == []
    assert body["ranking"][1]["weaknesses"] == ["进入成本"]
    cost = body["ranking"][0]["contributions"][1]
    assert cost["raw_score"] == 20
    assert cost["adjusted_score"] == 80
    assert cost["weighted_points"] == 32


def test_decision_analysis_normalizes_weights_and_reports_close_result() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))
    request = _request()
    request["criteria"] = [
        {"id": "growth", "name": "增长潜力", "weight": 3, "direction": "benefit"},
        {"id": "cost", "name": "进入成本", "weight": 1, "direction": "cost"},
    ]

    response = client.post("/api/v1/decisions/analyze", json=request)

    assert response.status_code == 200
    body = response.json()
    assert body["ranking"][0]["score"] == 67.5
    assert body["score_gap"] == 2.5
    assert any("合计为 4%" in warning for warning in body["warnings"])
    assert any("综合得分接近" in warning for warning in body["warnings"])


def test_decision_analysis_identifies_weight_sensitive_winner() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))
    request = {
        "title": "权重敏感性测试",
        "criteria": [
            {"id": "c1", "name": "维度一", "weight": 50, "direction": "benefit"},
            {"id": "c2", "name": "维度二", "weight": 50, "direction": "benefit"},
        ],
        "options": [
            {"id": "a", "name": "方案 A", "scores": {"c1": 100, "c2": 40}},
            {"id": "b", "name": "方案 B", "scores": {"c1": 40, "c2": 100}},
        ],
    }

    response = client.post("/api/v1/decisions/analyze", json=request)

    assert response.status_code == 200
    body = response.json()
    assert body["recommended_option_id"] == "a"
    assert body["stability"] == "sensitive"
    assert body["sensitive_criteria"] == ["维度一", "维度二"]
    assert any("权重较敏感" in warning for warning in body["warnings"])


def test_decision_analysis_rejects_incomplete_or_invalid_matrix() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))
    request = _request()
    request["options"] = [
        {"id": "a", "name": "方案 A", "scores": {"growth": 101}},
        {"id": "b", "name": "方案 B", "scores": {"growth": 60, "cost": 20}},
    ]

    response = client.post("/api/v1/decisions/analyze", json=request)

    assert response.status_code == 422


def test_decision_analysis_rejects_duplicate_names() -> None:
    client = TestClient(create_app(Settings(environment="test", static_dir="/not-found")))
    request = _request()
    request["options"] = [
        {"id": "a", "name": "同一方案", "scores": {"growth": 80, "cost": 70}},
        {"id": "b", "name": "同一方案", "scores": {"growth": 60, "cost": 20}},
    ]

    response = client.post("/api/v1/decisions/analyze", json=request)

    assert response.status_code == 422
