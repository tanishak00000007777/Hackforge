from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from sqlalchemy.orm import DeclarativeBase

from app.config.settings import get_settings


# Load application settings
settings = get_settings()


# Create Async Engine
engine = create_async_engine(
    settings.database_url,
    echo=True,              # Shows SQL queries in terminal (turn False in production)
    future=True,
    pool_pre_ping=True,     # Checks connection before using it
)


# Create Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# Base class for all models
class Base(DeclarativeBase):
    pass


# Dependency to get DB session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()