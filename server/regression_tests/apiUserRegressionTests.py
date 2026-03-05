"""API route tests for user-related endpoints in main.py.

This module contains unit tests for FastAPI endpoints related to user information
and authentication.

Test classes:
    TestUserAPIRoutes: Tests for user information and authentication endpoints.
"""

import os
import sys

# Add parent directory to path to import constants and other modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the test base class
from regression_tests.apiQuestionsRegressionTests import APIQuestionsTestCase
from fastapi.testclient import TestClient

# Import the modules to test
from database.getItemsFromDatabase import get_person, get_student_details
from config.settings import settings


class TestUserAPIRoutes(APIQuestionsTestCase):
    """Tests for user-related API routes."""
    
    def test_get_user_info(self):
        """Test the /api/get-user-info endpoint."""
        client = self.get_authenticated_client()
        
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("user", data)
        self.assertIn("tree", data)
        
        # Check user structure
        user = data["user"]
        self.assertIn("username", user)
        self.assertIn("displayName", user)
        self.assertIn("email", user)
        self.assertIn("roles", user)
        
        # Check tree structure
        tree = data["tree"]
        self.assertIn("treeID", tree)
        self.assertIn("health", tree)
        self.assertIn("growthStage", tree)
        self.assertIn("resourceLevels", tree)
        
        # Check resourceLevels if present (may be None)
        if tree["resourceLevels"] is not None:
            self.assertIn("water", tree["resourceLevels"])
            self.assertIn("earth", tree["resourceLevels"])
            self.assertIn("sun", tree["resourceLevels"])
    
    def test_get_user_info_returns_correct_user(self):
        """Test that /api/get-user-info returns the correct user information."""
        client = self.get_authenticated_client()
        
        response = client.get("/api/get-user-info")
        data = response.json()
        
        user = data["user"]
        self.assertEqual(user["username"], "test_student@example.com")
        self.assertEqual(user["displayName"], "Test Student")
        self.assertEqual(user["email"], "test_student@example.com")
        self.assertIn(settings.ROLE_STUDENT, user["roles"])
    
    def test_get_user_info_tree_has_resources(self):
        """Test that the tree in /api/get-user-info has resource levels."""
        client = self.get_authenticated_client()
        
        response = client.get("/api/get-user-info")
        data = response.json()
        
        tree = data["tree"]
        self.assertIsNotNone(tree)
        
        # Check resource levels
        self.assertIsNotNone(tree["resourceLevels"])
        
        # Check that all resource levels are present and are numbers
        resources = tree["resourceLevels"]
        self.assertIsInstance(resources["water"], int)
        self.assertIsInstance(resources["earth"], int)
        self.assertIsInstance(resources["sun"], int)
        
        # Check that resources are within valid range (0-100)
        self.assertGreaterEqual(resources["water"], 0)
        self.assertLessEqual(resources["water"], 100)
        self.assertGreaterEqual(resources["earth"], 0)
        self.assertLessEqual(resources["earth"], 100)
        self.assertGreaterEqual(resources["sun"], 0)
        self.assertLessEqual(resources["sun"], 100)
    
    def test_get_user_info_unauthenticated(self):
        """Test that /api/get-user-info requires authentication."""
        from main import app
        client = TestClient(app)
        
        # Clear any dependency overrides to test actual authentication
        app.dependency_overrides.clear()
        
        # Without authentication, the endpoint should return 401 Unauthorized
        response = client.get("/api/get-user-info", follow_redirects=False)
        
        # Should get an unauthorized response (401) or a redirect (307)
        self.assertIn(response.status_code, [401, 307])
    
    def test_auth_verify_creates_new_account(self):
        """Test that /api/auth/verify creates a new account if it doesn't exist."""
        from main import app
        client = TestClient(app)
        
        # Create a mock user that doesn't exist yet
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
        
        # Verify the account was created in the database
        person = get_person("newuser@example.com")
        self.assertIsNotNone(person)
        self.assertEqual(person["email"], "newuser@example.com")
    
    def test_auth_verify_existing_account(self):
        """Test that /api/auth/verify works with an existing account."""
        from main import app
        client = TestClient(app)
        
        # Create an account first
        username = self.create_test_student()
        
        # Mock Auth0 user data for existing user
        user_data = {
            "email": username,
            "sub": "auth0|existing",
            "name": "Test Student",
            "nickname": "teststudent"
        }
        
        response = client.post("/api/auth/verify", json={"user": user_data})
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "Session established")
    
    def test_auth_verify_no_user_data(self):
        """Test that /api/auth/verify fails when no user data is provided."""
        from main import app
        client = TestClient(app)
        
        response = client.post("/api/auth/verify", json={})
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "No user data provided")

    def test_get_account_profile_defaults(self):
        """Test that /api/get-user-info returns defaults when no custom profile is stored."""
        client = self.get_authenticated_client()

        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        user = data["user"]

        self.assertEqual(user["username"], "test_student@example.com")
        self.assertEqual(user["email"], "test_student@example.com")
        self.assertEqual(user["displayName"], "Test Student")
        self.assertIsNone(user.get("contactEmail"))
        self.assertIsNone(user.get("educationLevel"))

    def test_update_account_profile_persists(self):
        """Test that /api/update-user can be used to update profile and is persisted in the database."""
        client = self.get_authenticated_client()

        update_payload = {
            "username": "test_student@example.com",
            "displayName": "Updated Student",
            "email": "updated@example.com",
            "roles": ["Student"],
            "contactEmail": "contact@example.com",
            "educationLevel": 2,
        }
        response = client.put("/api/update-user", json=update_payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

        # Verify returned payload reflects updated account/profile values
        updated_user = response.json()["user"]
        self.assertEqual(updated_user["displayName"], "Updated Student")
        self.assertEqual(updated_user["email"], "updated@example.com")
        self.assertEqual(updated_user["contactEmail"], "contact@example.com")
        self.assertEqual(updated_user["educationLevel"], "2")

        # Verify persistence in database
        person = get_person("test_student@example.com")
        self.assertEqual(person["displayName"], "Updated Student")
        self.assertEqual(person["email"], "updated@example.com")

        details = get_student_details("test_student@example.com")
        self.assertEqual(details["contactEmail"], "contact@example.com")
        self.assertEqual(details["studentLevel"], 2)


if __name__ == '__main__':
    import unittest
    unittest.main()
