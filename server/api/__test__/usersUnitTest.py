"""Unit tests for users router.

This module contains isolated unit tests for user management endpoints,
with all external dependencies mocked.

Test classes:
    TestGetUserInfo: Tests for the /api/get-user-info endpoint
    TestUpdateUser: Tests for the /api/update-user endpoint
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from config.settings import settings


class TestGetUserInfo(unittest.TestCase):
    """Tests for get_user_info endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = FastAPI()
        self.mock_student = {
            "username": "student@example.com",
            "email": "student@example.com",
            "displayName": "Test Student",
            "roles": [settings.ROLE_STUDENT]
        }
        self.mock_tree = {
            "treeID": "tree-uuid-123",
            "health": settings.HEALTH_HEALTHY,
            "growthStage": 2,
            "resourceLevels": {
                settings.RESOURCE_WATER: 75,
                settings.RESOURCE_EARTH: 80,
                settings.RESOURCE_SUN: 65
            }
        }

    def test_get_user_info_success(self):
        """Test successfully retrieving user information."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIn("user", data)
            self.assertIn("tree", data)

    def test_get_user_info_contains_user_data(self):
        """Test that response contains correct user data."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            data = response.json()
            
            user = data["user"]
            self.assertEqual(user["username"], "student@example.com")
            self.assertEqual(user["email"], "student@example.com")
            self.assertEqual(user["displayName"], "Test Student")
            self.assertIn(settings.ROLE_STUDENT, user["roles"])

    def test_get_user_info_contains_tree_data(self):
        """Test that response contains correct tree data."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            data = response.json()
            
            tree = data["tree"]
            self.assertEqual(tree["treeID"], "tree-uuid-123")
            self.assertEqual(tree["health"], settings.HEALTH_HEALTHY)
            self.assertEqual(tree["growthStage"], 2)
            self.assertIn(settings.RESOURCE_WATER, tree["resourceLevels"])
            self.assertEqual(tree["resourceLevels"][settings.RESOURCE_WATER], 75)

    def test_get_user_info_tree_health_states(self):
        """Test that tree can have different health states."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            # Test each valid health status
            for health_status in settings.VALID_HEALTH_STATUSES:
                tree_with_status = self.mock_tree.copy()
                tree_with_status["health"] = health_status
                mock_tree_service.get_tree_with_decay.return_value = tree_with_status
                
                response = client.get("/api/get-user-info")
                data = response.json()
                
                self.assertEqual(response.status_code, 200)
                self.assertEqual(data["tree"]["health"], health_status)

    def test_get_user_info_resource_levels_within_bounds(self):
        """Test that resource levels are within valid bounds."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            tree_data = {
                "treeID": "tree-uuid-123",
                "health": settings.HEALTH_HEALTHY,
                "growthStage": 2,
                "resourceLevels": {
                    settings.RESOURCE_WATER: settings.RESOURCE_MAX_LEVEL,
                    settings.RESOURCE_EARTH: settings.RESOURCE_MIN_LEVEL,
                    settings.RESOURCE_SUN: 50
                }
            }
            mock_tree_service.get_tree_with_decay.return_value = tree_data
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            data = response.json()
            
            resources = data["tree"]["resourceLevels"]
            self.assertEqual(resources[settings.RESOURCE_WATER], settings.RESOURCE_MAX_LEVEL)
            self.assertEqual(resources[settings.RESOURCE_EARTH], settings.RESOURCE_MIN_LEVEL)
            self.assertGreaterEqual(resources[settings.RESOURCE_SUN], settings.RESOURCE_MIN_LEVEL)
            self.assertLessEqual(resources[settings.RESOURCE_SUN], settings.RESOURCE_MAX_LEVEL)

    def test_get_user_info_no_tree(self):
        """Test that endpoint handles case when tree is None."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_with_decay.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIsNone(data["tree"])

    def test_get_user_info_applies_decay(self):
        """Test that get_user_info calls get_tree_with_decay."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            client.get("/api/get-user-info")
            
            # Verify TreeService.get_tree_with_decay was called
            mock_tree_service.get_tree_with_decay.assert_called_once_with(
                "student@example.com"
            )

    def test_get_user_info_resource_levels_structure(self):
        """Test that resource levels have correct structure."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            data = response.json()
            
            resources = data["tree"]["resourceLevels"]
            # Verify all three resources are present
            for resource in [settings.RESOURCE_WATER, settings.RESOURCE_EARTH, settings.RESOURCE_SUN]:
                self.assertIn(resource, resources)

    def test_get_user_info_no_username(self):
        """Test that endpoint handles missing username gracefully."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            student_no_username = {
                "email": "student@example.com",
                "displayName": "Test Student",
                "roles": [settings.ROLE_STUDENT]
            }
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = student_no_username
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])

    def test_get_user_info_teacher_role(self):
        """Test that endpoint works with teacher role."""
        with patch('api.routers.users.TreeService') as mock_tree_service, \
             patch('api.routers.users.student_required') as mock_student_required:
            
            teacher = {
                "username": "teacher@example.com",
                "email": "teacher@example.com",
                "displayName": "Test Teacher",
                "roles": [settings.ROLE_TEACHER]
            }
            
            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
            mock_student_required.return_value = teacher
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.get("/api/get-user-info")
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn(settings.ROLE_TEACHER, data["user"]["roles"])


class TestUpdateUser(unittest.TestCase):
    """Tests for update_user endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = FastAPI()
        self.mock_student = {
            "username": "student@example.com",
            "email": "student@example.com",
            "displayName": "Test Student",
            "roles": [settings.ROLE_STUDENT]
        }

    def test_update_user_not_implemented(self):
        """Test that update_user returns not implemented message."""
        with patch('api.routers.users.student_required') as mock_student_required:
            
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.post("/api/update-user", json={
                "displayName": "Updated Name"
            })
            
            # Since it's not implemented, should return the not implemented message
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["message"], "Not implemented yet")

    def test_update_user_endpoint_exists(self):
        """Test that update_user endpoint is accessible."""
        with patch('api.routers.users.student_required') as mock_student_required:
            
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.users import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            # Should not return 404
            response = client.post("/api/update-user", json={})
            self.assertNotEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
