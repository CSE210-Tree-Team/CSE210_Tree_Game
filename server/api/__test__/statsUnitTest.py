"""Unit tests for stats router.

This module contains isolated unit tests for tree stat update endpoints,
with all external dependencies mocked.

Test classes:
    TestUpdateStat: Tests for the /api/update-stat endpoint
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from config.settings import settings


class TestUpdateStat(unittest.TestCase):
    """Tests for update_stat endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = FastAPI()
        self.mock_student = {
            "username": "student@example.com",
            "email": "student@example.com",
            "displayName": "Test Student",
            "roles": [settings.ROLE_STUDENT]
        }

    def test_update_stat_water_success(self):
        """Test successfully updating water stat."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": 10
            })
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIn(settings.RESOURCE_WATER, data["message"].lower())

    def test_update_stat_earth_success(self):
        """Test successfully updating earth stat."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_EARTH,
                "value": 5
            })
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])

    def test_update_stat_sun_success(self):
        """Test successfully updating sun stat."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_SUN,
                "value": -3
            })
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])

    def test_update_stat_all_resources(self):
        """Test updating all valid resource types."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            # Test each valid resource
            for resource in [settings.RESOURCE_WATER, settings.RESOURCE_EARTH, settings.RESOURCE_SUN]:
                response = client.put("/api/update-stat", json={
                    "stat_name": resource,
                    "value": 10
                })
                self.assertEqual(response.status_code, 200)

    def test_update_stat_case_insensitive(self):
        """Test that stat_name is case-insensitive."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            # Test with uppercase
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER.upper(),
                "value": 10
            })
            
            self.assertEqual(response.status_code, 200)
            
            # Verify TreeService.update_tree_stat was called with lowercase
            mock_tree_service.update_tree_stat.assert_called()
            call_args = mock_tree_service.update_tree_stat.call_args
            self.assertEqual(call_args[0][1], settings.RESOURCE_WATER)

    def test_update_stat_max_value(self):
        """Test updating stat with maximum allowed value."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": settings.RESOURCE_MAX_LEVEL
            })
            
            self.assertEqual(response.status_code, 200)

    def test_update_stat_min_value(self):
        """Test updating stat with minimum allowed value."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": settings.RESOURCE_MIN_LEVEL
            })
            
            self.assertEqual(response.status_code, 200)

    def test_update_stat_negative_value(self):
        """Test updating stat with negative value."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": -15
            })
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])

    def test_update_stat_missing_stat_name(self):
        """Test that missing stat_name returns 400 error."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "value": 10
            })
            
            self.assertEqual(response.status_code, 400)

    def test_update_stat_missing_value(self):
        """Test that missing value returns 400 error."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER
            })
            
            self.assertEqual(response.status_code, 400)

    def test_update_stat_invalid_value_type(self):
        """Test that non-integer value returns 400 error."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            # Test with boolean
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": True
            })
            
            self.assertEqual(response.status_code, 400)

    def test_update_stat_tree_not_found(self):
        """Test that missing tree returns 404 error."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": 10
            })
            
            self.assertEqual(response.status_code, 404)

    def test_update_stat_service_error(self):
        """Test that service error returns 500."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.side_effect = Exception("Database error")
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": 10
            })
            
            self.assertEqual(response.status_code, 500)

    def test_update_stat_value_error(self):
        """Test that ValueError from service returns 400."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.side_effect = ValueError("Invalid stat name")
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            response = client.put("/api/update-stat", json={
                "stat_name": "invalid",
                "value": 10
            })
            
            self.assertEqual(response.status_code, 400)

    def test_update_stat_calls_service_with_correct_params(self):
        """Test that update_stat calls TreeService with correct parameters."""
        with patch('api.routers.stats.TreeService') as mock_tree_service, \
             patch('api.routers.stats.student_required') as mock_student_required:
            
            mock_tree_service.get_tree_id.return_value = "tree-uuid-123"
            mock_tree_service.update_tree_stat.return_value = None
            mock_student_required.return_value = self.mock_student
            
            self.app = FastAPI()
            from api.routers.stats import router
            self.app.include_router(router)
            
            client = TestClient(self.app)
            
            client.put("/api/update-stat", json={
                "stat_name": settings.RESOURCE_WATER,
                "value": 10
            })
            
            # Verify TreeService.update_tree_stat was called with correct params
            mock_tree_service.update_tree_stat.assert_called_once_with(
                "tree-uuid-123",
                settings.RESOURCE_WATER,
                10
            )


if __name__ == "__main__":
    unittest.main()
