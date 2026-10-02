import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.config import get_settings

settings = get_settings()

# For SQLite async engine, enable connect_args check_same_thread=False
connect_args = {}
db_url = settings.DATABASE_URL

# Auto-convert standard postgres urls to asyncpg
if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Clean up query params that asyncpg might not support (like channel_binding)
    if "?" in db_url:
        db_url = db_url.split("?")[0]
    db_url += "?ssl=require"

if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables asynchronously."""
    from backend.app.models.base import Base
    # Ensure all models are imported so they register in Base.metadata
    import backend.app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
