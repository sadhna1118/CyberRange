import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_login_success(async_client: AsyncClient):
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "test_admin", "password": "TestPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "test_admin"
    assert data["user"]["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_auth_login_invalid_password(async_client: AsyncClient):
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "test_admin", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_auth_register_and_login(async_client: AsyncClient):
    reg_res = await async_client.post(
        "/api/auth/register",
        json={
            "username": "new_soc_analyst",
            "email": "analyst_new@cyberrange.lab",
            "password": "SecurePassword2026!",
            "full_name": "New Analyst",
            "role": "SOC_ANALYST",
        },
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    assert token is not None

    # Verify /me endpoint
    me_res = await async_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "new_soc_analyst"
