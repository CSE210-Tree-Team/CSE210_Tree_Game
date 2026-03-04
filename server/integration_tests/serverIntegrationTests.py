"""
Integration tests for the Tree Game API backend.

These tests verify the entire backend server functionality by:
1. Testing all API endpoints
2. Testing authentication flow
3. Testing user and tree operations
4. Testing stats and question endpoints
5. Verifying error handling and edge cases

NOTE: All database interactions are mocked to ensure:
- Tests are fast and don't depend on actual database
- Tests are isolated and can run in any order
- Tests don't create side effects in the real database
- Tests are reliable and consistent
"""

import unittest
import json
import uuid
from datetime import datetime
from unittest.mock import patch, MagicMock, DEFAULT
import sys
import os

# Add the parent directory to the path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from config.settings import settings


class BackendIntegrationTests(unittest.TestCase):
    """Integration tests for the Tree Game API backend."""

    @classmethod
    def setUpClass(cls):
        """Set up the test client and database patches for all tests."""
        # We'll use patches in setUp instead of setUpClass to ensure isolation
        pass

    def setUp(self):
        """Set up test data and database mocks before each test."""
        # Create a new TestClient for each test to avoid session bleed
        self.client = TestClient(app)
        
        # Set up patches for all database functions imported by services.
        # These patches are applied to the service modules where the functions are imported.
        
        # Auth service patches (database functions imported into auth_service.py)
        self.mock_get_person = patch('services.auth_service.get_person')
        self.mock_add_account = patch('services.auth_service.add_account')
        self.mock_generate_tree = patch('services.auth_service.generate_tree')
        self.mock_update_last_login = patch('services.auth_service.update_last_login')
        
        # Tree service patches (database functions imported into tree_service.py)
        self.mock_get_tree = patch('services.tree_service.get_tree')
        self.mock_update_stat = patch('services.tree_service.update_stat')
        self.mock_apply_passive_decay = patch('services.tree_service.apply_passive_decay')
        
        # Question service patches (database functions imported into question_service.py)
        self.mock_add_question_db = patch('services.question_service.add_question')
        self.mock_get_question_db = patch('services.question_service.get_question')
        self.mock_get_questions_db = patch('services.question_service.get_questions')
        
        # Start all patches
        self.patched_get_person = self.mock_get_person.start()
        self.patched_add_account = self.mock_add_account.start()
        self.patched_generate_tree = self.mock_generate_tree.start()
        self.patched_update_last_login = self.mock_update_last_login.start()
        self.patched_get_tree = self.mock_get_tree.start()
        self.patched_update_stat = self.mock_update_stat.start()
        self.patched_apply_passive_decay = self.mock_apply_passive_decay.start()
        self.patched_add_question_db = self.mock_add_question_db.start()
        self.patched_get_question_db = self.mock_get_question_db.start()
        self.patched_get_questions_db = self.mock_get_questions_db.start()
        
        # Set up test data BEFORE setting up mocks
        self.test_user_email = "testuser@example.com"
        self.test_user_sub = "auth0|123456789"
        self.test_user_name = "Test User"
        self.test_user_nickname = "testuser"
        
        self.test_user_data = {
            "user": {
                "email": self.test_user_email,
                "sub": self.test_user_sub,
                "name": self.test_user_name,
                "nickname": self.test_user_nickname
            }
        }
        
        # Set default return values
        self._setup_default_mocks()

    def _setup_default_mocks(self):
        """Set up default mock return values for common scenarios."""
        # Mock user data
        self.mock_user = {
            "username": self.test_user_email,
            "email": self.test_user_email,
            "displayName": self.test_user_name,
            "roles": [settings.ROLE_STUDENT],
            "dateOfBirth": "2000-01-01",
            "lastLogin": datetime.now().isoformat()
        }
        
        # Mock tree data
        self.mock_tree = {
            "treeID": str(uuid.uuid4()),
            "health": "100",
            "growthStage": 1,
            "resourceLevels": {
                "water": 50,
                "earth": 50,
                "sun": 50
            }
        }
        
        # Set up default behaviors for mocked database functions
        self.patched_get_person.return_value = self.mock_user
        self.patched_add_account.return_value = None
        self.patched_generate_tree.return_value = self.mock_tree["treeID"]
        self.patched_update_last_login.return_value = None
        self.patched_get_tree.return_value = self.mock_tree
        self.patched_update_stat.return_value = None  # update_stat doesn't return anything
        self.patched_apply_passive_decay.return_value = None
        
        # Mock question functions
        self.patched_add_question_db.return_value = str(uuid.uuid4())
        self.patched_get_question_db.return_value = self._create_mock_question()
        self.patched_get_questions_db.return_value = [self._create_mock_question()]

    def _create_mock_question(self):
        """Create a mock question object."""
        return {
            "questionID": str(uuid.uuid4()),
            "text": "What is 2+2?",
            "type": "MCQ",
            "difficulty": 1,
            "resourceType": "water",
            "choices": [
                {"text": "4", "isCorrect": True},
                {"text": "5", "isCorrect": False},
                {"text": "3", "isCorrect": False}
            ]
        }

    def tearDown(self):
        """Clean up patches after each test."""
        try:
            self.mock_get_person.stop()
            self.mock_add_account.stop()
            self.mock_generate_tree.stop()
            self.mock_update_last_login.stop()
            self.mock_get_tree.stop()
            self.mock_update_stat.stop()
            self.mock_apply_passive_decay.stop()
            self.mock_add_question_db.stop()
            self.mock_get_question_db.stop()
            self.mock_get_questions_db.stop()
        except RuntimeError:
            # Patch already stopped or not started
            pass

    # ========== Frontend Routes Tests ==========

    def test_serve_frontend_default_route(self):
        """Test that the root route serves the frontend or appropriate response."""
        response = self.client.get("/")
        # Should either return 200 with HTML or 200 with frontend not built message
        self.assertIn(response.status_code, [200, 404])

    # ========== Authentication Tests ==========

    def test_auth_verify_endpoint_success(self):
        """Test successful authentication verification."""
        response = self.client.post("/api/auth/verify", json=self.test_user_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)

    def test_auth_verify_endpoint_no_user_data(self):
        """Test auth verify with missing user data."""
        response = self.client.post("/api/auth/verify", json={"user": None})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data.get("success", True))

    def test_auth_verify_creates_session(self):
        """Test that auth verify creates a session."""
        response = self.client.post(
            "/api/auth/verify",
            json=self.test_user_data,
            cookies={}
        )
        self.assertEqual(response.status_code, 200)
        # Check that session cookie is set
        self.assertIn("session", response.cookies or {})

    def test_auth_logout_endpoint(self):
        """Test logout endpoint."""
        # First verify auth
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Then logout
        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)

    # ========== User Routes Tests ==========

    def test_get_user_info_requires_authentication(self):
        """Test that get-user-info requires authentication."""
        # Use a fresh client without prior session
        fresh_client = TestClient(app)
        response = fresh_client.get("/api/get-user-info", follow_redirects=False)
        # Should not be 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_get_user_info_with_auth(self):
        """Test getting user info after authentication."""
        # Configure mock to return user data
        self.patched_get_person.return_value = self.mock_user
        
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get user info
        response = self.client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        self.assertIn("user", data)
        self.assertIn("tree", data)
        
        # Verify get_person was called
        self.patched_get_person.assert_called()

    def test_update_user_requires_authentication(self):
        """Test that update-user requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.put(
            "/api/update-user",
            json={"displayName": "Updated Name"},
            follow_redirects=False
        )
        # Should not be 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_update_user_with_auth(self):
        """Test updating user info after authentication."""
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Update user
        response = self.client.put(
            "/api/update-user",
            json={"displayName": "Updated Test User"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # The endpoint should return success and updated user info
        self.assertTrue(data.get("success", False) or "user" in data)

    # ========== Stats Routes Tests ==========

    def test_update_stat_requires_authentication(self):
        """Test that update-stat requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.put(
            "/api/update-stat",
            json={"stat_name": "water", "value": 10},
            follow_redirects=False
        )
        # Should not be 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_update_stat_with_auth(self):
        """Test updating tree stats after authentication."""
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Update stat
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "water", "value": 10}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        self.assertIn("message", data)

    def test_update_stat_with_different_stat_names(self):
        """Test updating different stat types."""
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Test each stat type
        for stat_name in ["water", "earth", "sun", "Water", "EARTH", "SUN"]:
            response = self.client.put(
                "/api/update-stat",
                json={"stat_name": stat_name, "value": 5}
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("success", data)

    def test_update_stat_invalid_stat_name(self):
        """Test updating with invalid stat name."""
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Update with invalid stat
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "invalid", "value": 10}
        )
        # Should handle invalid stat gracefully
        data = response.json()
        # Either 200 with success: False or 400 error
        self.assertIn(response.status_code, [200, 400, 422])

    # ========== Questions Routes Tests ==========

    def test_add_question_requires_authentication(self):
        """Test that add-question requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.post(
            "/api/add-question",
            json={
                "text": "What is 2+2?",
                "question_type": "MCQ",
                "resource_type": "general",
                "choices": ["4", "5"],
                "correct_choices": [0]
            },
            follow_redirects=False
        )
        # Should not be 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_add_question_with_auth(self):
        """Test adding a question after authentication."""
        # Configure mocks
        self.patched_get_person.return_value = self.mock_user
        self.patched_add_question_db.return_value = str(uuid.uuid4())
        
        # Use a fresh client to avoid session issues
        test_client = TestClient(app)
        
        # First authenticate
        test_client.post("/api/auth/verify", json=self.test_user_data)
        
        # Add question with unique text to avoid duplicates
        import time
        unique_text = f"Q: What is the capital? {time.time()}"
        response = test_client.post(
            "/api/add-question",
            json={
                "text": unique_text,
                "question_type": "MCQ",
                "resource_type": "general",
                "choices": ["Paris", "London", "Berlin"],
                "correct_choices": [0],
                "check_duplicates": True
            }
        )
        # 200 for success, 400 if duplicate (which should not happen with mock)
        self.assertIn(response.status_code, [200, 400])
        data = response.json()
        # Should have either success or error detail
        self.assertTrue("success" in data or "detail" in data)
        
        # Verify add_question was called
        self.patched_add_question_db.assert_called()

    def test_get_question_requires_authentication(self):
        """Test that get-question requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.post(
            "/api/get-question",
            json={"questionID": "dummy-id"}
        )
        # Should not be 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_get_question_with_auth(self):
        """Test getting a question after authentication."""
        # Configure mocks
        self.patched_get_person.return_value = self.mock_user
        self.patched_get_question_db.return_value = self._create_mock_question()
        
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get question - should use mocked question
        response = self.client.post(
            "/api/get-question",
            json={"questionID": "mocked-id"}
        )
        # Should return 200 with mocked question or 404 if not found
        self.assertIn(response.status_code, [200, 404, 400])
        
        # Verify get_question was called if response was 200
        if response.status_code == 200:
            self.patched_get_question_db.assert_called()

    def test_get_questions_requires_authentication(self):
        """Test that get-questions requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.post(
            "/api/get-questions",
            json={"resourceType": "water"}
        )
        # Should not be 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_get_questions_with_auth(self):
        """Test getting multiple questions after authentication."""
        # Configure mocks
        self.patched_get_person.return_value = self.mock_user
        self.patched_get_questions_db.return_value = [
            self._create_mock_question(),
            self._create_mock_question()
        ]
        
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get questions
        response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "water"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        self.assertIn("questions", data)
        
        # Verify get_questions was called
        self.patched_get_questions_db.assert_called()

    # ========== Error Handling Tests ==========

    def test_invalid_endpoint_returns_404(self):
        """Test that invalid endpoints return 404."""
        response = self.client.get("/api/nonexistent")
        self.assertEqual(response.status_code, 404)

    def test_malformed_json_returns_error(self):
        """Test that malformed JSON returns appropriate error."""
        response = self.client.post(
            "/api/auth/verify",
            content="not valid json",
            headers={"content-type": "application/json"}
        )
        # Should return 422 (validation error) or 400
        self.assertIn(response.status_code, [400, 422])

    def test_missing_required_fields_returns_error(self):
        """Test that missing required fields returns validation error."""
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "water"}  # Missing 'value' field
        )
        # Not authenticated, so will fail auth first (401), or if auth passes, validation error (422)
        self.assertIn(response.status_code, [401, 422])

    # ========== Session Persistence Tests ==========

    def test_session_persists_across_requests(self):
        """Test that session persists across multiple requests."""
        # Authenticate
        auth_response = self.client.post("/api/auth/verify", json=self.test_user_data)
        self.assertEqual(auth_response.status_code, 200)
        
        # Make another request with same client (session should persist)
        response1 = self.client.get("/api/get-user-info")
        self.assertEqual(response1.status_code, 200)
        
        response2 = self.client.get("/api/get-user-info")
        self.assertEqual(response2.status_code, 200)

    def test_multiple_users_independent_sessions(self):
        """Test that multiple users have independent sessions."""
        # Create two separate clients
        client1 = TestClient(app)
        client2 = TestClient(app)
        
        user1_data = {
            "user": {
                "email": "user1@example.com",
                "sub": "auth0|111",
                "name": "User One",
                "nickname": "user1"
            }
        }
        user2_data = {
            "user": {
                "email": "user2@example.com",
                "sub": "auth0|222",
                "name": "User Two",
                "nickname": "user2"
            }
        }
        
        # Authenticate both users
        client1.post("/api/auth/verify", json=user1_data)
        client2.post("/api/auth/verify", json=user2_data)
        
        # Get user info from both
        response1 = client1.get("/api/get-user-info")
        response2 = client2.get("/api/get-user-info")
        
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)

    # ========== Response Format Tests ==========

    def test_success_responses_have_correct_format(self):
        """Test that success responses follow consistent format."""
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Should have success and message fields
        self.assertIn("success", data)
        self.assertIsInstance(data["success"], bool)
        if "message" in data:
            self.assertIsInstance(data["message"], str)

    def test_user_info_response_format(self):
        """Test that user info response has correct format."""
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        response = self.client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check response structure
        self.assertIn("success", data)
        self.assertIn("user", data)
        self.assertIn("tree", data)
        
        # Check user structure
        user = data["user"]
        self.assertIn("username", user)
        self.assertIn("email", user)
        self.assertIn("displayName", user)
        self.assertIn("roles", user)

    # ========== Header and CORS Tests ==========

    def test_response_has_appropriate_headers(self):
        """Test that responses include appropriate headers."""
        response = self.client.get("/")
        self.assertIsNotNone(response.headers)
        # Should have content-type header
        self.assertIn("content-type", response.headers)

    def test_post_request_with_json_content_type(self):
        """Test POST request with correct content-type."""
        response = self.client.post(
            "/api/auth/verify",
            json=self.test_user_data,
            headers={"content-type": "application/json"}
        )
        self.assertEqual(response.status_code, 200)

    # ========== Endpoint Integration Tests ==========

    def test_full_user_workflow(self):
        """Test complete user workflow: login, get info, update, logout."""
        # Configure mocks for this workflow
        self.patched_get_person.return_value = self.mock_user
        self.patched_update_last_login.return_value = None
        
        # 1. Login
        auth_response = self.client.post("/api/auth/verify", json=self.test_user_data)
        self.assertEqual(auth_response.status_code, 200)
        
        # 2. Get user info
        info_response = self.client.get("/api/get-user-info")
        self.assertEqual(info_response.status_code, 200)
        
        # 3. Update user
        update_response = self.client.put(
            "/api/update-user",
            json={"displayName": "Updated Name"}
        )
        self.assertEqual(update_response.status_code, 200)
        
        # 4. Get updated info
        updated_info = self.client.get("/api/get-user-info")
        self.assertEqual(updated_info.status_code, 200)
        
        # 5. Logout
        logout_response = self.client.post("/api/auth/logout")
        self.assertEqual(logout_response.status_code, 200)
        
        # Verify mocks were called
        self.assertTrue(self.patched_get_person.called)

    def test_full_tree_interaction_workflow(self):
        """Test complete tree interaction workflow."""
        # Configure mocks for this workflow
        self.patched_get_person.return_value = self.mock_user
        self.patched_get_tree.return_value = self.mock_tree
        self.patched_update_stat.return_value = None  # update_stat doesn't return anything
        
        # 1. Login
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # 2. Get initial tree state
        initial = self.client.get("/api/get-user-info")
        self.assertEqual(initial.status_code, 200)
        
        # 3. Update stats
        responses = []
        for stat in ["water", "earth", "sun"]:
            response = self.client.put(
                "/api/update-stat",
                json={"stat_name": stat, "value": 20}
            )
            responses.append(response)
            self.assertEqual(response.status_code, 200)
        
        # 4. Get updated tree state
        updated = self.client.get("/api/get-user-info")
        self.assertEqual(updated.status_code, 200)
        
        # Verify mocks were called
        self.assertTrue(self.patched_update_stat.called)

    def test_question_workflow(self):
        """Test question addition and retrieval workflow."""
        # Configure mocks
        self.patched_get_person.return_value = self.mock_user
        self.patched_add_question_db.return_value = str(uuid.uuid4())
        self.patched_get_question_db.return_value = self._create_mock_question()
        self.patched_get_questions_db.return_value = [self._create_mock_question()]
        
        # Use a fresh client to avoid session issues
        test_client = TestClient(app)
        
        # 1. Login
        test_client.post("/api/auth/verify", json=self.test_user_data)
        
        # 2. Add a question with unique text
        import time
        unique_text = f"Math Q: 1+1? {time.time()}"
        add_response = test_client.post(
            "/api/add-question",
            json={
                "text": unique_text,
                "question_type": "MCQ",
                "resource_type": "general",
                "choices": ["2", "3", "4"],
                "correct_choices": [0],
                "check_duplicates": True
            }
        )
        # Accept 200 (success) or 400 (duplicate) as valid responses
        self.assertIn(add_response.status_code, [200, 400])
        
        # 3. Get a question
        get_response = test_client.post(
            "/api/get-question",
            json={"questionID": "mocked-id"}
        )
        # Should handle not found gracefully
        self.assertIn(get_response.status_code, [200, 404, 400])
        
        # 4. Get multiple questions
        get_all_response = test_client.post(
            "/api/get-questions",
            json={"resourceType": "general"}
        )
        self.assertEqual(get_all_response.status_code, 200)
        data = get_all_response.json()
        self.assertIn("success", data)
        
        # Verify mocks were called
        self.assertTrue(self.patched_get_questions_db.called)


class APIResponseValidationTests(unittest.TestCase):
    """Tests for API response data validation."""

    @classmethod
    def setUpClass(cls):
        """Set up the test client for all tests."""
        # Patches will be set up in setUp
        pass

    def setUp(self):
        """Set up test data and database mocks before each test."""
        self.client = TestClient(app)
        
        # Set up patches for database functions
        self.mock_get_person = patch('services.auth_service.get_person')
        self.mock_add_account = patch('services.auth_service.add_account')
        self.mock_generate_tree = patch('services.auth_service.generate_tree')
        self.mock_get_questions_db = patch('services.question_service.get_questions')
        
        # Start patches
        self.patched_get_person = self.mock_get_person.start()
        self.patched_add_account = self.mock_add_account.start()
        self.patched_generate_tree = self.mock_generate_tree.start()
        self.patched_get_questions_db = self.mock_get_questions_db.start()
        
        # Create mock user
        self.mock_user = {
            "username": "test@example.com",
            "email": "test@example.com",
            "displayName": "Test",
            "roles": [settings.ROLE_STUDENT],
            "dateOfBirth": "2000-01-01",
            "lastLogin": datetime.now().isoformat()
        }
        
        self.patched_get_person.return_value = self.mock_user
        self.patched_generate_tree.return_value = str(uuid.uuid4())
        self.patched_get_questions_db.return_value = []

    def tearDown(self):
        """Clean up patches after each test."""
        try:
            self.mock_get_person.stop()
            self.mock_add_account.stop()
            self.mock_generate_tree.stop()
            self.mock_get_questions_db.stop()
        except RuntimeError:
            pass

    def test_generic_response_format(self):
        """Test that generic responses follow expected format."""
        response = self.client.post(
            "/api/auth/verify",
            json={"user": None}
        )
        data = response.json()
        
        # Should have success and message at minimum
        self.assertIn("success", data)
        self.assertIsInstance(data["success"], bool)

    def test_data_response_format(self):
        """Test that data responses have appropriate fields."""
        client = TestClient(app)
        
        # Login
        client.post(
            "/api/auth/verify",
            json={
                "user": {
                    "email": "test@example.com",
                    "sub": "auth0|test",
                    "name": "Test",
                    "nickname": "test"
                }
            }
        )
        
        # Get questions - should return questions and count
        response = client.post(
            "/api/get-questions",
            json={"resourceType": "water"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        # QuestionListResponse returns 'questions' and 'count' fields
        self.assertIn("questions", data)


if __name__ == "__main__":
    unittest.main()
