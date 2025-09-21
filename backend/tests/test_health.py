import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_root_hello(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json().get("message") == "Hola mundo"
