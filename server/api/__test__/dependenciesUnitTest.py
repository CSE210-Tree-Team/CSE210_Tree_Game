"""Unit tests for dependencies module.

This module contains isolated unit tests for authentication and authorization
dependencies, with all external dependencies mocked.

Test classes:
    TestGetUsername: Tests for the get_username dependency
    TestGetCurrentUser: Tests for the get_current_user dependency
    TestStudentRequired: Tests for the student_required dependency
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends
from config.settings import settings
from utils.exceptions import NeedLoginException


class TestGetUsername(unittest.TestCase):
    """Tests for get_username dependency."""

    def test_get_username_valid_username(self):
        """Test extracting valid username from session."""
        with patch('api.dependencies.AuthService'):
            from api.dependencies import get_username
            
            # Create mock request with session
            request = Mock(spec=Request)
            request.session = {"user": "test@example.com"}
            
            username = get_username(request)
            
            self.assertEqual(username, "test@example.com")

    def test_get_username_different_usernames(self):
        """Test with various username formats."""
        with patch('api.dependencies.AuthService'):
            from api.dependencies import get_username
            
            # Test with email
            request = Mock(spec=Request)
            request.session = {"user": "student@university.edu"}
            username = get_username(request)
            self.assertEqual(username, "student@university.edu")
            
            # Test with auth0 sub
            request.session = {"user": "auth0|123456"}
            username = get_username(request)
            self.assertEqual(username, "auth0|123456")

    def test_get_username_no_username_raises_exception(self):
        """Test that missing username raises NeedLoginException."""
        with patch('api.dependencies.AuthService'):
            from api.dependencies import get_username
            
            request = Mock(spec=Request)
            request.session = {}
            
            with self.assertRaises(NeedLoginException):
                get_username(request)

    def test_get_username_none_username_raises_exception(self):
        """Test that None username raises NeedLoginException."""
        with patch('api.dependencies.AuthService'):
            from api.dependencies import get_username
            
            request = Mock(spec=Request)
            request.session = {"user": None}
            
            with self.assertRaises(NeedLoginException):
                get_username(request)


class TestGetCurrentUser(unittest.TestCase):
    """Tests for get_current_user dependency."""

    def test_get_current_user_success(self):
        """Test successfully getting current user."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = {
                "username": "test@example.com",
                "email": "test@example.com",
                "displayName": "Test User",
                "roles": [settings.ROLE_STUDENT]
            }
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "test@example.com"}
            
            user = get_current_user(request)
            
            self.assertEqual(user["username"], "test@example.com")
            self.assertEqual(user["email"], "test@example.com")

    def test_get_current_user_no_username_raises_exception(self):
        """Test that missing username raises NeedLoginException."""
        with patch('api.dependencies.AuthService'):
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {}
            
            with self.assertRaises(NeedLoginException):
                get_current_user(request)

    def test_get_current_user_user_not_found(self):
        """Test that missing user returns HTTPException 403."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = None
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "nonexistent@example.com"}
            
            with self.assertRaises(HTTPException) as exc_info:
                get_current_user(request)
            
            self.assertEqual(exc_info.exception.status_code, 403)

    def test_get_current_user_returns_user_dict(self):
        """Test that get_current_user returns complete user dictionary."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_user = {
                "username": "test@example.com",
                "email": "test@example.com",
                "displayName": "Test User",
                "roles": [settings.ROLE_STUDENT],
                "dateOfBirth": "2000-01-01",
                "lastLogin": "2026-03-03"
            }
            mock_auth_service.get_user.return_value = mock_user
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "test@example.com"}
            
            user = get_current_user(request)
            
            self.assertIn("username", user)
            self.assertIn("email", user)
            self.assertIn("displayName", user)
            self.assertIn("roles", user)

    def test_get_current_user_calls_auth_service_with_correct_username(self):
        """Test that get_current_user calls AuthService with correct username."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = {
                "username": "test@example.com"
            }
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "test@example.com"}
            
            get_current_user(request)
            
            mock_auth_service.get_user.assert_called_once_with("test@example.com")

    def test_get_current_user_with_student_role(self):
        """Test getting current user with student role."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = {
                "username": "student@example.com",
                "roles": [settings.ROLE_STUDENT]
            }
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "student@example.com"}
            
            user = get_current_user(request)
            
            self.assertIn(settings.ROLE_STUDENT, user["roles"])

    def test_get_current_user_with_teacher_role(self):
        """Test getting current user with teacher role."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = {
                "username": "teacher@example.com",
                "roles": [settings.ROLE_TEACHER]
            }
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "teacher@example.com"}
            
            user = get_current_user(request)
            
            self.assertIn(settings.ROLE_TEACHER, user["roles"])

    def test_get_current_user_with_multiple_roles(self):
        """Test getting current user with multiple roles."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.get_user.return_value = {
                "username": "admin@example.com",
                "roles": [settings.ROLE_STUDENT, settings.ROLE_TEACHER]
            }
            
            from api.dependencies import get_current_user
            
            request = Mock(spec=Request)
            request.session = {"user": "admin@example.com"}
            
            user = get_current_user(request)
            
            self.assertEqual(len(user["roles"]), 2)


class TestStudentRequired(unittest.TestCase):
    """Tests for student_required dependency."""

    def test_student_required_with_student_role(self):
        """Test that student_required allows students."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.is_student.return_value = True
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "student@example.com",
                "roles": [settings.ROLE_STUDENT]
            }
            
            result = student_required(request, person)
            
            self.assertEqual(result, person)

    def test_student_required_with_teacher_role(self):
        """Test that student_required denies teachers."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.is_student.return_value = False
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "teacher@example.com",
                "roles": [settings.ROLE_TEACHER]
            }
            
            with self.assertRaises(HTTPException) as exc_info:
                student_required(request, person)
            
            self.assertEqual(exc_info.exception.status_code, 403)

    def test_student_required_with_no_person(self):
        """Test that student_required denies when person is None."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            
            with self.assertRaises(HTTPException) as exc_info:
                student_required(request, None)
            
            self.assertEqual(exc_info.exception.status_code, 403)

    def test_student_required_calls_auth_service(self):
        """Test that student_required calls AuthService.is_student."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.is_student.return_value = True
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "student@example.com",
                "roles": [settings.ROLE_STUDENT]
            }
            
            student_required(request, person)
            
            mock_auth_service.is_student.assert_called_once_with("student@example.com")

    def test_student_required_checks_role_based_access(self):
        """Test that student_required properly enforces role-based access."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            # First call: student
            mock_auth_service.is_student.return_value = True
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "student@example.com",
                "roles": [settings.ROLE_STUDENT]
            }
            
            result = student_required(request, person)
            self.assertEqual(result, person)
            
            # Second call: non-student
            mock_auth_service.is_student.return_value = False
            
            with self.assertRaises(HTTPException):
                student_required(request, person)

    def test_student_required_error_message_contains_detail(self):
        """Test that student_required error contains 'Student role required'."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.is_student.return_value = False
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "teacher@example.com",
                "roles": [settings.ROLE_TEACHER]
            }
            
            with self.assertRaises(HTTPException) as exc_info:
                student_required(request, person)
            
            self.assertIn("Student", str(exc_info.exception.detail))

    def test_student_required_with_valid_username_and_student_role(self):
        """Test student_required with valid username and student role."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.is_student.return_value = True
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "valid_student@example.com",
                "email": "valid_student@example.com",
                "displayName": "Valid Student",
                "roles": [settings.ROLE_STUDENT]
            }
            
            result = student_required(request, person)
            
            self.assertEqual(result["username"], "valid_student@example.com")
            self.assertIn(settings.ROLE_STUDENT, result["roles"])

    def test_student_required_returns_same_person_object(self):
        """Test that student_required returns the same person object passed in."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_auth_service.is_student.return_value = True
            
            from api.dependencies import student_required
            
            request = Mock(spec=Request)
            person = {
                "username": "student@example.com",
                "email": "student@example.com",
                "extra_field": "extra_value"
            }
            
            result = student_required(request, person)
            
            # Should be the exact same object
            self.assertIs(result, person)
            self.assertEqual(result["extra_field"], "extra_value")


class TestDependenciesIntegration(unittest.TestCase):
    """Integration tests for dependencies working together."""

    def test_dependency_chain_get_current_user_then_student_required(self):
        """Test that get_current_user and student_required work together."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_user = {
                "username": "student@example.com",
                "email": "student@example.com",
                "displayName": "Test Student",
                "roles": [settings.ROLE_STUDENT]
            }
            mock_auth_service.get_user.return_value = mock_user
            mock_auth_service.is_student.return_value = True
            
            from api.dependencies import get_current_user, student_required
            
            request = Mock(spec=Request)
            request.session = {"user": "student@example.com"}
            
            # Get current user
            user = get_current_user(request)
            self.assertIsNotNone(user)
            
            # Then apply student_required
            result = student_required(request, user)
            self.assertEqual(result["username"], "student@example.com")

    def test_dependency_chain_teacher_access_denied(self):
        """Test that teacher is denied access via student_required."""
        with patch('api.dependencies.AuthService') as mock_auth_service:
            mock_user = {
                "username": "teacher@example.com",
                "email": "teacher@example.com",
                "displayName": "Test Teacher",
                "roles": [settings.ROLE_TEACHER]
            }
            mock_auth_service.get_user.return_value = mock_user
            mock_auth_service.is_student.return_value = False
            
            from api.dependencies import get_current_user, student_required
            
            request = Mock(spec=Request)
            request.session = {"user": "teacher@example.com"}
            
            # Get current user
            user = get_current_user(request)
            self.assertIsNotNone(user)
            
            # Try to apply student_required - should fail
            with self.assertRaises(HTTPException):
                student_required(request, user)


if __name__ == "__main__":
    unittest.main()
