"""Unit tests for auth router.

This module contains isolated unit tests for authentication endpoints,
with all external dependencies mocked.

Test classes:
    TestVerifyAuth: Tests for the /api/auth/verify endpoint
    TestLogout: Tests for the /api/auth/logout endpoint
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from config.settings import settings


class TestVerifyAuth(unittest.TestCase):
    """Tests for verify_auth endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = FastAPI()
        
        # Patch the AuthService before importing the router
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            self.mock_auth_service = mock_auth_service
            from api.routers.auth import router
            self.router = router
            self.app.include_router(router)
        
        self.client = TestClient(self.app)

    def test_verify_auth_new_user_creates_account(self):
        """Test that verify_auth creates a new account for non-existent users."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = None
            mock_auth_service.create_account.return_value = None
            mock_auth_service.update_login.return_value = None
            
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            user_data = {
                "email": "newuser@example.com",
                "sub": "auth0|12345",
                "name": "New User",
                "nickname": "newuser"
            }
            
            response = client.post("/api/auth/verify", json={"user": user_data})
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["message"], "Session established")
            
            # Verify AuthService.create_account was called
            mock_auth_service.create_account.assert_called_once()

    def test_verify_auth_existing_user_no_account_creation(self):
        """Test that verify_auth doesn't create account for existing users."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            existing_user = {
                "username": "existing@example.com",
                "email": "existing@example.com",
                "displayName": "Existing User"
            }
            mock_auth_service.get_user.return_value = existing_user
            mock_auth_service.update_login.return_value = None
            
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            user_data = {
                "email": "existing@example.com",
                "sub": "auth0|existing",
                "name": "Existing User",
                "nickname": "existing"
            }
            
            response = client.post("/api/auth/verify", json={"user": user_data})
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            
            # Verify AuthService.create_account was NOT called
            mock_auth_service.create_account.assert_not_called()

    def test_verify_auth_no_user_data(self):
        """Test that verify_auth returns error when user data is missing."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            response = client.post("/api/auth/verify", json={})
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["message"], "No user data provided")

    def test_verify_auth_uses_email_or_sub(self):
        """Test that verify_auth uses email if available, otherwise sub."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = None
            mock_auth_service.create_account.return_value = None
            mock_auth_service.update_login.return_value = None
            
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            # Test with email
            user_data = {
                "email": "test@example.com",
                "sub": "auth0|123",
                "name": "Test User",
                "nickname": "test"
            }
            
            client.post("/api/auth/verify", json={"user": user_data})
            
            # Verify get_user was called with email
            mock_auth_service.get_user.assert_called_with("test@example.com")

    def test_verify_auth_fallback_to_sub_when_no_email(self):
        """Test that verify_auth falls back to sub when email is not provided."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = None
            mock_auth_service.create_account.return_value = None
            mock_auth_service.update_login.return_value = None
            
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            user_data = {
                "sub": "auth0|123",
                "name": "Test User",
                "nickname": "test"
            }
            
            client.post("/api/auth/verify", json={"user": user_data})
            
            # Verify get_user was called with sub
            mock_auth_service.get_user.assert_called_with("auth0|123")

    def test_verify_auth_updates_login(self):
        """Test that verify_auth calls update_login."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = {"username": "test@example.com"}
            mock_auth_service.update_login.return_value = None
            
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            user_data = {
                "email": "test@example.com",
                "sub": "auth0|123",
                "name": "Test User",
                "nickname": "test"
            }
            
            client.post("/api/auth/verify", json={"user": user_data})
            
            # Verify update_login was called
            mock_auth_service.update_login.assert_called_once_with("test@example.com")

    def test_verify_auth_service_error(self):
        """Test that verify_auth returns 400 on AuthService error."""
        with patch('api.routers.auth.AuthService') as mock_auth_service:
            mock_auth_service.get_user.side_effect = Exception("Database error")
            
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            user_data = {
                "email": "test@example.com",
                "sub": "auth0|123",
                "name": "Test User",
                "nickname": "test"
            }
            
            response = client.post("/api/auth/verify", json={"user": user_data})
            
            self.assertEqual(response.status_code, 400)


class TestLogout(unittest.TestCase):
    """Tests for logout endpoint."""

    def test_logout_clears_session(self):
        """Test that logout endpoint clears the session."""
        with patch('api.routers.auth.AuthService'):
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            response = client.post("/api/auth/logout")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["message"], "Session cleared")

    def test_logout_returns_success_message(self):
        """Test that logout endpoint returns correct success message."""
        with patch('api.routers.auth.AuthService'):
            self.app = FastAPI()
            from api.routers.auth import router
            self.app.include_router(router)
            client = TestClient(self.app)
            
            response = client.post("/api/auth/logout")
            data = response.json()
            
            self.assertEqual(data["message"], "Session cleared")


if __name__ == "__main__":
    unittest.main()
