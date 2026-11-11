"""API integration tests with TestClient."""

from fastapi.testclient import TestClient
from uag.api.app import create_app

client = TestClient(create_app())


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "providers" in data
    assert "db" in data


def test_providers():
    r = client.get("/providers")
    assert r.status_code == 200
    assert r.json()["simulation"] is True


def test_node_run_merge_flow():
    r = client.post("/nodes", json={"title": "api-test", "models": ["grok-4"]})
    assert r.status_code == 200
    node_id = r.json()["id"]

    r = client.post(f"/nodes/{node_id}/run", json={"prompt": "hello fastapi health"})
    assert r.status_code == 200
    assert r.json()["status"] == "done"
    assert len(r.json()["outputs"]) >= 1

    r = client.post("/merge", json={"node_ids": [node_id], "mode": "synthesis"})
    assert r.status_code == 200
    assert r.json()["status"] == "done"
    assert "final_content" in r.json()


def test_merge_texts():
    r = client.post("/merge/texts", json={"texts": ["alpha", "beta"], "mode": "synthesis"})
    assert r.status_code == 200
    assert "result" in r.json()


def test_stats():
    r = client.get("/stats")
    assert r.status_code == 200
    assert "db" in r.json()
