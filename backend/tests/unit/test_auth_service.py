import pytest
from datetime import datetime, timedelta
from unittest.mock import patch
from jose import jwt

from app.core.config import settings
from app.core.security import verify_password
from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.auth import Token
from app.core.exceptions import InvalidCredentialsException, UserNotFoundException

pytestmark = pytest.mark.asyncio

class TestAuthService:
    @pytest.fixture
    def auth_service(self):
        return AuthService()

    @pytest.fixture
    async def test_user_in_db(self, db_session):
        user = User(
            email="test@example.com",
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGRH3nw5obu",  # password: test123
            full_name="Test User",
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    async def test_authenticate_user_success(self, auth_service, test_user_in_db, db_session):
        # Act
        user = await auth_service.authenticate_user(
            email="test@example.com",
            password="test123",
            db=db_session
        )
        
        # Assert
        assert user is not None
        assert user.email == test_user_in_db.email
        assert user.full_name == test_user_in_db.full_name

    async def test_authenticate_user_wrong_password(self, auth_service, test_user_in_db, db_session):
        # Act & Assert
        with pytest.raises(InvalidCredentialsException):
            await auth_service.authenticate_user(
                email="test@example.com",
                password="wrongpassword",
                db=db_session
            )

    async def test_authenticate_user_not_found(self, auth_service, db_session):
        # Act & Assert
        with pytest.raises(UserNotFoundException):
            await auth_service.authenticate_user(
                email="nonexistent@example.com",
                password="test123",
                db=db_session
            )

    async def test_create_access_token(self, auth_service):
        # Arrange
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=15)
        
        # Act
        token = auth_service.create_access_token(data, expires_delta)
        
        # Assert
        assert isinstance(token, str)
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert decoded["sub"] == "test@example.com"
        assert "exp" in decoded
        
        # Verify expiration time
        exp = datetime.fromtimestamp(decoded["exp"])
        now = datetime.utcnow()
        assert (exp - now) < timedelta(minutes=16)  # Allow 1 minute buffer
        assert (exp - now) > timedelta(minutes=14)  # At least 14 minutes remaining

    async def test_create_access_token_default_expiry(self, auth_service):
        # Arrange
        data = {"sub": "test@example.com"}
        
        # Act
        token = auth_service.create_access_token(data)
        
        # Assert
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        exp = datetime.fromtimestamp(decoded["exp"])
        now = datetime.utcnow()
        assert (exp - now) < timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES + 1)
        assert (exp - now) > timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES - 1)

    async def test_get_current_user_success(self, auth_service, test_user_in_db, db_session):
        # Arrange
        token = auth_service.create_access_token({"sub": test_user_in_db.email})
        
        # Act
        user = await auth_service.get_current_user(token, db_session)
        
        # Assert
        assert user is not None
        assert user.email == test_user_in_db.email
        assert user.full_name == test_user_in_db.full_name

    async def test_get_current_user_invalid_token(self, auth_service, db_session):
        # Act & Assert
        with pytest.raises(InvalidCredentialsException):
            await auth_service.get_current_user("invalid_token", db_session)

    async def test_get_current_user_expired_token(self, auth_service, test_user_in_db, db_session):
        # Arrange
        expired_delta = timedelta(minutes=-1)  # Token that expired 1 minute ago
        token = auth_service.create_access_token(
            {"sub": test_user_in_db.email},
            expired_delta
        )
        
        # Act & Assert
        with pytest.raises(InvalidCredentialsException):
            await auth_service.get_current_user(token, db_session)

    async def test_get_current_user_not_found(self, auth_service, db_session):
        # Arrange
        token = auth_service.create_access_token({"sub": "nonexistent@example.com"})
        
        # Act & Assert
        with pytest.raises(UserNotFoundException):
            await auth_service.get_current_user(token, db_session)

    async def test_get_current_active_user_success(self, auth_service, test_user_in_db):
        # Act
        user = await auth_service.get_current_active_user(test_user_in_db)
        
        # Assert
        assert user is not None
        assert user.email == test_user_in_db.email
        assert user.is_active is True

    async def test_get_current_active_user_inactive(self, auth_service, test_user_in_db, db_session):
        # Arrange
        test_user_in_db.is_active = False
        db_session.add(test_user_in_db)
        await db_session.commit()
        
        # Act & Assert
        with pytest.raises(InvalidCredentialsException):
            await auth_service.get_current_active_user(test_user_in_db)

    async def test_change_password_success(self, auth_service, test_user_in_db, db_session):
        # Arrange
        new_password = "newpassword123"
        
        # Act
        updated_user = await auth_service.change_password(
            test_user_in_db,
            "test123",  # Current password
            new_password,
            db_session
        )
        
        # Assert
        assert updated_user is not None
        assert verify_password(new_password, updated_user.hashed_password)

    async def test_change_password_wrong_current(self, auth_service, test_user_in_db, db_session):
        # Act & Assert
        with pytest.raises(InvalidCredentialsException):
            await auth_service.change_password(
                test_user_in_db,
                "wrongpassword",
                "newpassword123",
                db_session
            ) 