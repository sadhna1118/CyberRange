import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_investigate_incident(async_client: AsyncClient, analyst_token: str):
    headers = {"Authorization": f"Bearer {analyst_token}"}

    # 1. Create Incident
    create_res = await async_client.post(
        "/api/incidents",
        headers=headers,
        json={
            "title": "Suspected SSH Brute Force",
            "description": "Multiple unauthorized auth attempts detected from external IP",
            "severity": "high",
            "risk_score": 82,
            "affected_assets": ["lab-linux-01"],
            "indicators": ["10.10.10.50", "root"],
        },
    )
    assert create_res.status_code == 200
    inc_data = create_res.json()
    inc_id = inc_data["id"]

    # 2. Add Investigation Note
    note_res = await async_client.post(
        f"/api/incidents/{inc_id}/notes",
        headers=headers,
        json={"note_text": "Triage verified adversary origin. Escalating to containment."},
    )
    assert note_res.status_code == 200
    assert note_res.json()["note_text"] == "Triage verified adversary origin. Escalating to containment."

    # 3. Add Evidence with SHA-256
    ev_res = await async_client.post(
        f"/api/incidents/{inc_id}/evidence",
        headers=headers,
        json={
            "evidence_type": "log",
            "description": "Auth log snippet containing 6 failed login records",
            "raw_text": "Failed password for root from 10.10.10.50 port 45290",
        },
    )
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert "sha256_hash" in ev_data
    assert len(ev_data["sha256_hash"]) == 64

    # 4. Execute Response Playbook Action
    act_res = await async_client.post(
        f"/api/incidents/{inc_id}/actions",
        headers=headers,
        json={
            "action_type": "block_ip",
            "target_identifier": "10.10.10.50",
            "description": "Drop rule inserted into border firewall ACL",
        },
    )
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "SUCCESS"

    # 5. Fetch Full Investigation Timeline
    timeline_res = await async_client.get(
        f"/api/incidents/{inc_id}/timeline",
        headers=headers,
    )
    assert timeline_res.status_code == 200
    items = timeline_res.json()
    assert len(items) >= 3  # note, evidence/action items present
