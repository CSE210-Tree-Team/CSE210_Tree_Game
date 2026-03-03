"""Unit tests for auth service.

This module contains isolated unit tests for AuthService,
with all external dependencies mocked.
"""

import unittest
from unittest.mock import patch
from config.settings import settings
from services.auth_service import AuthService


class TestAuthService(unittest.TestCase):
    """Tests for AuthService."""

    @patch("services.auth_service.get_person")
    def test_is_student_true(self, mock_get_person):
        """Test is_student returns True for student role."""
        mock_get_person.return_value = {
            "username": "student@example.com",
            "roles": [settings.ROLE_STUDENT]
        }

        result = AuthService.is_student("student@example.com")

        self.assertTrue(result)
        mock_get_person.assert_called_once_with("student@example.com")

    @patch("services.auth_service.get_person")
    def test_is_student_false_for_teacher(self, mock_get_person):
        """Test is_student returns False for teacher role."""
        mock_get_person.return_value = {
            "username": "teacher@example.com",
            "roles": [settings.ROLE_TEACHER]
        }

        result = AuthService.is_student("teacher@example.com")

        self.assertFalse(result)

    @patch("services.auth_service.get_person")
    def test_is_student_false_when_user_missing(self, mock_get_person):
        """Test is_student returns False when user does not exist."""
        mock_get_person.return_value = None

        result = AuthService.is_student("missing@example.com")

        self.assertFalse(result)

    @patch("services.auth_service.get_person")
    def test_get_user_returns_user_data(self, mock_get_person):
        """Test get_user returns person dictionary from data layer."""
        mock_user = {
            "username": "test@example.com",
            "email": "test@example.com",
            "displayName": "Test User",
            "roles": [settings.ROLE_STUDENT]
        }
        mock_get_person.return_value = mock_user

        user = AuthService.get_user("test@example.com")

        self.assertEqual(user, mock_user)
        mock_get_person.assert_called_once_with("test@example.com")

    @patch("services.auth_service.generate_tree")
    @patch("services.auth_service.add_account")
    def test_create_account_success(self, mock_add_account, mock_generate_tree):
        """Test create_account creates account and tree with expected defaults."""
        mock_generate_tree.return_value = "tree-uuid-123"
        user_data = {
            "email": "new@example.com",
            "name": "New Student",
            "nickname": "newstudent",
            "sub": "auth0|123"
        }

        username, tree_id = AuthService.create_account("new@example.com", user_data)

        self.assertEqual(username, "new@example.com")
        self.assertEqual(tree_id, "tree-uuid-123")
        mock_add_account.assert_called_once_with(
            username="new@example.com",
            email="new@example.com",
            passwordHash="auth0",
            displayName="New Student",
            accountReference="newstudent",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
        mock_generate_tree.assert_called_once_with("new@example.com")

    @patch("services.auth_service.generate_tree")
    @patch("services.auth_service.add_account")
    def test_create_account_fallback_defaults(self, mock_add_account, mock_generate_tree):
        """Test create_account uses fallback values when optional fields are absent."""
        mock_generate_tree.return_value = "tree-uuid-789"
        user_data = {"sub": "auth0|abc"}

        AuthService.create_account("auth0|abc", user_data)

        mock_add_account.assert_called_once_with(
            username="auth0|abc",
            email="",
            passwordHash="auth0",
            displayName="Student",
            accountReference="user",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
        mock_generate_tree.assert_called_once_with("auth0|abc")

    @patch("services.auth_service.generate_tree")
    @patch("services.auth_service.add_account")
    def test_create_account_raises_when_add_account_fails(self, mock_add_account, mock_generate_tree):
        """Test create_account re-raises errors from account creation."""
        mock_add_account.side_effect = Exception("db failure")

        with self.assertRaises(Exception):
            AuthService.create_account("bad@example.com", {"email": "bad@example.com"})

        mock_generate_tree.assert_not_called()

    @patch("services.auth_service.update_last_login")
    def test_update_login_calls_data_layer(self, mock_update_last_login):
        """Test update_login delegates to update_last_login."""
        AuthService.update_login("student@example.com")

        mock_update_last_login.assert_called_once_with("student@example.com")


if __name__ == "__main__":
    unittest.main()
