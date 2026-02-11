"""API route tests for stat-related endpoints in main.py.

This module contains unit tests for FastAPI endpoints related to user information
and authentication, specifically /api/update-stat, followed by /api/get-user-info to verify stat updates.

Test classes:
    TestStatAPIRoutes: Tests for stat-related API endpoints.
"""

import os
import sys

# Add parent directory to path to import constants and other modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the test base class
from tests.apiQuestionsUnitTests import APIQuestionsTestCase
from fastapi.testclient import TestClient

# Import the modules to test
from Database.getItemsFromDatabase import get_person
from constants import ROLE_STUDENT


class TestStatAPIRoutes(APIQuestionsTestCase):
    """Tests for stat-related API routes."""
    
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
        
        self.assertIn("water", tree["resourceLevels"])
        self.assertIn("earth", tree["resourceLevels"])
        self.assertIn("sun", tree["resourceLevels"])