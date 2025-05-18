import os
import pytest
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.main import app
from app.api.deps import get_db

# Test database URL
TEST_DATABASE_URL = settings.DATABASE_URL.replace("dealreel", "dealreel_test")

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

# Test session factory
TestingSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_db() -> AsyncGenerator:
    """Create test database tables."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session(test_db) -> AsyncGenerator[AsyncSession, None]:
    """Get a test database session."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
        await session.close()

@pytest.fixture(scope="function")
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """Get a test client with the test database session."""
    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user() -> dict:
    """Get a test user data."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }

@pytest.fixture(scope="function")
async def authenticated_client(client: AsyncClient, test_user: dict) -> AsyncGenerator[AsyncClient, None]:
    """Get an authenticated test client."""
    # Create user
    response = await client.post("/api/users", json=test_user)
    assert response.status_code == 201
    
    # Login
    response = await client.post("/api/auth/login", data={
        "username": test_user["email"],
        "password": test_user["password"]
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Update client headers with token
    client.headers["Authorization"] = f"Bearer {token}"
    yield client 