import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_run_simulation_scenario_via_api(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List scenarios
    list_res = await async_client.get("/api/simulations", headers=headers)
    assert list_res.status_code == 200
    scenarios = list_res.json()
    assert len(scenarios) >= 7

    # 2. Run SCENARIO-001 (Brute Force)
    run_res = await async_client.post("/api/simulations/SCENARIO-001/run", headers=headers)
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "COMPLETED"
    assert run_data["events_generated"] >= 7
    assert run_data["alerts_generated"] >= 1
    assert run_data["risk_score"] > 0
