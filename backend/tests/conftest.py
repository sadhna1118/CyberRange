import os
import sys
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.models.base import Base
from backend.app.database.database import get_db
from backend.app.main import app
from backend.app.models.user import User
from backend.app.api.auth import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # Seed test admin & analyst users
        admin = User(
            username="test_admin",
            email="admin@test.lab",
            hashed_password=get_password_hash("TestPass123!"),
            role="ADMIN",
            full_name="Test Admin",
            is_active=True,
        )
        analyst = User(
            username="test_analyst",
            email="analyst@test.lab",
            hashed_password=get_password_hash("TestPass123!"),
            role="SOC_ANALYST",
            full_name="Test Analyst",
            is_active=True,
        )
        viewer = User(
            username="test_viewer",
            email="viewer@test.lab",
            hashed_password=get_password_hash("TestPass123!"),
            role="VIEWER",
            full_name="Test Viewer",
            is_active=True,
        )
        session.add_all([admin, analyst, viewer])
        await session.commit()
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


from httpx import AsyncClient, ASGITransport

@pytest.fixture(scope="function")
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token() -> str:
    return create_access_token({"sub": "test_admin", "role": "ADMIN"})


@pytest.fixture
def analyst_token() -> str:
    return create_access_token({"sub": "test_analyst", "role": "SOC_ANALYST"})


@pytest.fixture
def viewer_token() -> str:
    return create_access_token({"sub": "test_viewer", "role": "VIEWER"})
