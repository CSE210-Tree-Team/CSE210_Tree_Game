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
from api.__test__.test_helpers import create_test_app
from starlette.middleware.sessions import SessionMiddleware


class TestGetUserInfo(unittest.TestCase):
    """Tests for get_user_info endpoint."""

    def setUp(self):
        """Set up test fixtures."""
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
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertTrue(data["success"])
                self.assertIn("user", data)
                self.assertIn("tree", data)

    def test_get_user_info_contains_user_data(self):
        """Test that response contains correct user data."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                data = response.json()
                
                user = data["user"]
                self.assertEqual(user["username"], "student@example.com")
                self.assertEqual(user["email"], "student@example.com")
                self.assertEqual(user["displayName"], "Test Student")
                self.assertIn(settings.ROLE_STUDENT, user["roles"])

    def test_get_user_info_contains_tree_data(self):
        """Test that response contains correct tree data."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
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
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                mock_get_student_details.return_value = {}
                
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
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
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
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                data = response.json()
            
            resources = data["tree"]["resourceLevels"]
            self.assertEqual(resources[settings.RESOURCE_WATER], settings.RESOURCE_MAX_LEVEL)
            self.assertEqual(resources[settings.RESOURCE_EARTH], settings.RESOURCE_MIN_LEVEL)
            self.assertGreaterEqual(resources[settings.RESOURCE_SUN], settings.RESOURCE_MIN_LEVEL)
            self.assertLessEqual(resources[settings.RESOURCE_SUN], settings.RESOURCE_MAX_LEVEL)

    def test_get_user_info_no_tree(self):
        """Test that endpoint handles case when tree is None."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = None
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertTrue(data["success"])
                self.assertIsNone(data["tree"])

    def test_get_user_info_applies_decay(self):
        """Test that get_user_info calls get_tree_with_decay."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                client.get("/api/get-user-info")
                
                # Verify TreeService.get_tree_with_decay was called
                mock_tree_service.get_tree_with_decay.assert_called_once_with(
                    "student@example.com"
                )

    def test_get_user_info_resource_levels_structure(self):
        """Test that resource levels have correct structure."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                data = response.json()
                
                resources = data["tree"]["resourceLevels"]
                # Verify all three resources are present
                for resource in [settings.RESOURCE_WATER, settings.RESOURCE_EARTH, settings.RESOURCE_SUN]:
                    self.assertIn(resource, resources)

    def test_get_user_info_no_username(self):
        """Test that endpoint handles missing username gracefully."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                student_no_username = {
                    "username": "",
                    "email": "student@example.com",
                    "displayName": "Test Student",
                    "roles": [settings.ROLE_STUDENT]
                }
                
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=student_no_username)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertTrue(data["success"])

    def test_get_user_info_teacher_role(self):
        """Test that endpoint works with teacher role."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                teacher = {
                    "username": "teacher@example.com",
                    "email": "teacher@example.com",
                    "displayName": "Test Teacher",
                    "roles": [settings.ROLE_TEACHER]
                }
                
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=teacher)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn(settings.ROLE_TEACHER, data["user"]["roles"])


class TestUpdateUser(unittest.TestCase):
    """Tests for update_user endpoint."""

    def setUp(self):
        """Set up test fixtures."""
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

    def test_update_user_endpoint_exists(self):
        """Test that update_user endpoint is accessible via PUT."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_person') as mock_get_person:
                with patch('api.routers.users.get_student_details') as mock_get_student_details:
                    
                    mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                    mock_get_person.return_value = {"username": "student@example.com"}
                    mock_get_student_details.return_value = {}
                    
                    app = create_test_app(user_data=self.mock_student)
                    from api.routers.users import router
                    app.include_router(router)
                    
                    client = TestClient(app)
                    
                    # Should not return 404
                    response = client.put("/api/update-user", json={})
                    self.assertNotEqual(response.status_code, 404)

    def test_update_user_requires_put_method(self):
        """Test that update_user requires PUT method (not POST or GET)."""
        app = create_test_app(user_data=self.mock_student)
        from api.routers.users import router
        app.include_router(router)
        
        client = TestClient(app)
        
        # POST should not work (should try to match PUT only)
        response_post = client.post("/api/update-user", json={})
        # GET should not work
        response_get = client.get("/api/update-user")
        
        # Both should be method not allowed or not found
        self.assertIn(response_post.status_code, [405, 404, 422])
        self.assertIn(response_get.status_code, [405, 404])

    def test_update_user_success(self):
        """Test successfully updating user information."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_person') as mock_get_person:
                with patch('api.routers.users.get_student_details') as mock_get_student_details:
                    with patch('api.routers.users.update_account') as mock_update_account:
                        with patch('api.routers.users.upsert_student_details') as mock_upsert:
                            
                            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                            mock_get_person.return_value = {
                                "username": "student@example.com",
                                "email": "student@example.com",
                                "displayName": "Updated Student",
                                "roles": [settings.ROLE_STUDENT]
                            }
                            mock_get_student_details.return_value = {"studentLevel": "6-8"}
                            
                            app = create_test_app(user_data=self.mock_student)
                            from api.routers.users import router
                            app.include_router(router)
                            
                            client = TestClient(app)
                            
                            update_payload = {
                                "username": "student@example.com",
                                "displayName": "Updated Student",
                                "email": "student@example.com",
                                "roles": [settings.ROLE_STUDENT],
                                "contactEmail": "contact@example.com",
                                "educationLevel": "6-8"
                            }
                            
                            response = client.put("/api/update-user", json=update_payload)
                            
                            self.assertEqual(response.status_code, 200)
                            data = response.json()
                            self.assertTrue(data["success"])
                            self.assertIn("user", data)
                            self.assertEqual(data["user"]["username"], "student@example.com")

    def test_update_user_calls_update_functions(self):
        """Test that update_user calls the appropriate update functions."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_person') as mock_get_person:
                with patch('api.routers.users.get_student_details') as mock_get_student_details:
                    with patch('api.routers.users.update_account') as mock_update_account:
                        with patch('api.routers.users.upsert_student_details') as mock_upsert:
                            
                            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                            mock_get_person.return_value = {
                                "username": "student@example.com",
                                "email": "student@example.com",
                                "displayName": "Test Student",
                                "roles": [settings.ROLE_STUDENT]
                            }
                            mock_get_student_details.return_value = {}
                            
                            app = create_test_app(user_data=self.mock_student)
                            from api.routers.users import router
                            app.include_router(router)
                            
                            client = TestClient(app)
                            
                            response = client.put("/api/update-user", json={
                                "username": "student@example.com",
                                "displayName": "New Name",
                                "email": "new@example.com",
                                "roles": [settings.ROLE_STUDENT],
                                "contactEmail": "contact@example.com",
                                "educationLevel": "6-8"
                            })
                            
                            # Verify update functions were called
                            mock_update_account.assert_called_once()
                            mock_upsert.assert_called_once()

    def test_update_user_requires_authentication(self):
        """Test that update_user requires authentication."""
        from utils.exceptions import NeedLoginException, redirect_to_login_handler
        
        app = FastAPI()
        app.add_middleware(SessionMiddleware, secret_key="test-secret")
        app.add_exception_handler(NeedLoginException, redirect_to_login_handler)
        
        from api.routers.users import router
        app.include_router(router)
        
        client = TestClient(app)
        
        # Request without auth should fail
        response = client.put("/api/update-user", json={})
        self.assertNotEqual(response.status_code, 200)

    def test_update_user_partial_update(self):
        """Test updating only displayName without updating email."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_person') as mock_get_person:
                with patch('api.routers.users.get_student_details') as mock_get_student_details:
                    with patch('api.routers.users.update_account') as mock_update_account:
                        with patch('api.routers.users.upsert_student_details') as mock_upsert:
                            
                            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                            mock_get_person.return_value = {
                                "username": "student@example.com",
                                "email": "student@example.com",
                                "displayName": "New Name",
                                "roles": [settings.ROLE_STUDENT]
                            }
                            mock_get_student_details.return_value = {}
                            
                            app = create_test_app(user_data=self.mock_student)
                            from api.routers.users import router
                            app.include_router(router)
                            
                            client = TestClient(app)
                            
                            response = client.put("/api/update-user", json={
                                "displayName": "New Name"
                            })
                            
                            self.assertEqual(response.status_code, 200)
                            # Verify update_account was called for displayName
                            mock_update_account.assert_called_once()

    def test_update_user_response_contains_updated_data(self):
        """Test that update_user response contains the updated user data."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_person') as mock_get_person:
                with patch('api.routers.users.get_student_details') as mock_get_student_details:
                    with patch('api.routers.users.update_account'):
                        with patch('api.routers.users.upsert_student_details'):
                            
                            mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                            mock_get_person.return_value = {
                                "username": "student@example.com",
                                "email": "newemail@example.com",
                                "displayName": "Updated",
                                "roles": [settings.ROLE_STUDENT]
                            }
                            mock_get_student_details.return_value = {"studentLevel": "9-10"}
                            
                            app = create_test_app(user_data=self.mock_student)
                            from api.routers.users import router
                            app.include_router(router)
                            
                            client = TestClient(app)
                            
                            response = client.put("/api/update-user", json={
                                "email": "newemail@example.com",
                                "displayName": "Updated"
                            })
                            
                            data = response.json()
                            self.assertEqual(data["user"]["email"], "newemail@example.com")
                            self.assertEqual(data["user"]["displayName"], "Updated")

    def test_update_user_error_handling(self):
        """Test that update_user handles database errors gracefully."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_person') as mock_get_person:
                with patch('api.routers.users.get_student_details') as mock_get_student_details:
                    with patch('api.routers.users.update_account') as mock_update_account:
                        
                        mock_get_person.return_value = {"username": "student@example.com"}
                        mock_update_account.side_effect = Exception("Database error")
                        mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                        mock_get_student_details.return_value = {}
                        
                        app = create_test_app(user_data=self.mock_student)
                        from api.routers.users import router
                        app.include_router(router)
                        
                        client = TestClient(app)
                        
                        response = client.put("/api/update-user", json={
                            "email": "new@example.com"
                        })
                        
                        self.assertEqual(response.status_code, 500)

    def test_get_user_info_response_structure(self):
        """Test that get_user_info response has required structure."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                data = response.json()
                
                # Verify response structure
                self.assertIn("success", data)
                self.assertIn("user", data)
                self.assertIn("tree", data)
                self.assertTrue(data["success"])

    def test_get_user_info_user_fields_present(self):
        """Test that user object contains all required fields."""
        with patch('api.routers.users.TreeService') as mock_tree_service:
            with patch('api.routers.users.get_student_details') as mock_get_student_details:
                mock_tree_service.get_tree_with_decay.return_value = self.mock_tree
                mock_get_student_details.return_value = {"contactEmail": "parent@example.com", "studentLevel": "6-8"}
                
                app = create_test_app(user_data=self.mock_student)
                from api.routers.users import router
                app.include_router(router)
                
                client = TestClient(app)
                
                response = client.get("/api/get-user-info")
                user = response.json()["user"]
                
                required_fields = ["username", "email", "displayName", "roles"]
                for field in required_fields:
                    self.assertIn(field, user)


if __name__ == "__main__":
    unittest.main()
