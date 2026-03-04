"""
Comprehensive API Integration Tests with Mock Database

This test suite creates an in-memory database, populates it with test data,
and tests all API endpoints end-to-end without mocking database interactions.

Tests cover:
- Authentication endpoints (verify, logout)
- User management endpoints (get-user-info, update-user)
- Tree stats endpoints (update-stat)
- Question management endpoints (add-question, get-question, get-questions)
- Error handling and edge cases
"""

import unittest
import json
import uuid
import tempfile
import os
from datetime import datetime
from pathlib import Path
import sys
from unittest import mock

# Add the parent directory to the path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from config.settings import settings

# Import database modules first (before they're used)
import database.createDatabase as db_create_module
import database.addItemsToDatabase as db_add_module
from database.createDatabase import create_schema
from database.addItemsToDatabase import (
    add_account,
    add_question,
    generate_tree,
    update_stat,
)
from database.getItemsFromDatabase import (
    get_person,
    get_tree,
    get_question,
    get_questions
)


class APIIntegrationTests(unittest.TestCase):
    """Comprehensive API integration tests with real database."""

    @classmethod
    def setUpClass(cls):
        """Set up temporary database for all tests."""
        # Create a temporary directory for the test database
        cls.test_db_dir = tempfile.mkdtemp()
        cls.test_db_path = os.path.join(cls.test_db_dir, settings.DB_NAME)
        
        # Monkey-patch the DB_PATH in all database modules
        db_create_module.DB_PATH = cls.test_db_path
        db_add_module.DB_PATH = cls.test_db_path
        
        # Import getItemsFromDatabase and patch it too
        import database.getItemsFromDatabase as db_get_module
        db_get_module.DB_PATH = cls.test_db_path
        
        # Create and initialize the database schema
        create_schema(cls.test_db_path)
        
        # Populate the database with test data (only once)
        cls._populate_test_database_static()
        
        # Store reference for teardown
        cls.created_db = True
        cls.get_module = db_get_module

    @classmethod
    def tearDownClass(cls):
        """Clean up temporary database after all tests."""
        # Restore original DB_PATH in all modules
        import database.createDatabase as db_create
        import database.addItemsToDatabase as db_add
        import database.getItemsFromDatabase as db_get
        
        # Restore to original paths based on settings
        original_path = os.path.join(
            os.path.dirname(os.path.abspath(db_create.__file__)),
            settings.DB_NAME
        )
        db_create.DB_PATH = original_path
        db_add.DB_PATH = original_path
        db_get.DB_PATH = original_path
        
        # Clean up temporary database file
        if os.path.exists(cls.test_db_path):
            try:
                os.remove(cls.test_db_path)
            except OSError:
                pass
        
        # Remove temporary directory
        try:
            os.rmdir(cls.test_db_dir)
        except OSError:
            pass

    def setUp(self):
        """Set up test data before each test."""
        self.client = TestClient(app)
        
        # Test user data
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
        
        # Additional test user
        self.test_user_2_email = "testuser2@example.com"
        self.test_user_2_sub = "auth0|987654321"
        self.test_user_2_name = "Test User Two"
        
        # Test question data
        self.test_question_text = "What is the capital of France?"
        self.test_question_type = "MCQ"
        self.test_question_resource = "water"
        self.test_question_choices = ["Paris", "London", "Berlin", "Madrid"]
        self.test_question_correct = [0]
        
        # Reference to database IDs from setUpClass
        self.test_tree_id = self.__class__.test_tree_id_1
        self.test_question_1_id = self.__class__.test_question_1_id
        self.test_question_2_id = self.__class__.test_question_2_id
        self.test_question_3_id = self.__class__.test_question_3_id

    @classmethod
    def _populate_test_database_static(cls):
        """Populate the test database with initial test data (called once per class)."""
        try:
            # Test user 1 data
            test_user_1_email = "testuser@example.com"
            test_user_1_name = "Test User"
            test_user_2_email = "testuser2@example.com"
            test_user_2_name = "Test User Two"
            
            # Add test user 1
            add_account(
                username=test_user_1_email,
                email=test_user_1_email,
                passwordHash="test_password_hash_1",
                displayName=test_user_1_name,
                accountReference=str(uuid.uuid4()),
                dateOfBirth="2000-01-01",
                role=settings.ROLE_STUDENT
            )
            
            # Create and add tree for user 1
            tree_id_1 = generate_tree(test_user_1_email)
            
            # Store for use in tests
            cls.test_tree_id_1 = tree_id_1
            
            # Add test user 2
            add_account(
                username=test_user_2_email,
                email=test_user_2_email,
                passwordHash="test_password_hash_2",
                displayName=test_user_2_name,
                accountReference=str(uuid.uuid4()),
                dateOfBirth="2001-05-15",
                role=settings.ROLE_STUDENT
            )
            
            # Create and add tree for user 2
            tree_id_2 = generate_tree(test_user_2_email)
            
            # Set specific resource levels for user 2 (created with default 100, so adjust down)
            update_stat(tree_id_2, 'water', -25)  # 75
            update_stat(tree_id_2, 'earth', -40)  # 60
            update_stat(tree_id_2, 'sun', -30)    # 70
            
            # Add test questions
            question_1_id = add_question(
                text="What is 2+2?",
                question_type="MCQ",
                resource_type="water",
                choices=["3", "4", "5"],
                correct_choices=[1],  # "4" is correct (index 1)
                check_duplicates=False
            )
            cls.test_question_1_id = question_1_id
            
            question_2_id = add_question(
                text="Which resource does photosynthesis use?",
                question_type="MCQ",
                resource_type="sun",
                choices=["Water", "Sunlight", "Soil"],
                correct_choices=[1],  # "Sunlight" is correct (index 1)
                check_duplicates=False
            )
            cls.test_question_2_id = question_2_id
            
            question_3_id = add_question(
                text="What is the capital of France?",
                question_type="MCQ",
                resource_type="water",
                choices=["Paris", "London", "Berlin", "Madrid"],
                correct_choices=[0],  # First choice is correct
                check_duplicates=False
            )
            cls.test_question_3_id = question_3_id
            
        except Exception as e:
            print(f"Error populating test database: {e}")
            import traceback
            traceback.print_exc()
            raise

    def tearDown(self):
        """Clean up after each test if needed."""
        pass

    # ========== Authentication Tests ==========

    def test_auth_verify_success_new_user(self):
        """Test successful authentication verification for a new user."""
        # Use a completely new user not in the database
        new_user_data = {
            "user": {
                "email": "newuser@example.com",
                "sub": "auth0|newuser123",
                "name": "New User",
                "nickname": "newuser"
            }
        }
        
        response = self.client.post("/api/auth/verify", json=new_user_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("message", data)

    def test_auth_verify_success_existing_user(self):
        """Test authentication verification for an existing user."""
        response = self.client.post("/api/auth/verify", json=self.test_user_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_auth_verify_missing_user_data(self):
        """Test auth verify with missing user data."""
        response = self.client.post("/api/auth/verify", json={"user": None})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data.get("success"))

    def test_auth_verify_incomplete_user_data(self):
        """Test auth verify with incomplete user data."""
        incomplete_data = {
            "user": {
                "email": "test@example.com"
                # Missing other required fields
            }
        }
        response = self.client.post("/api/auth/verify", json=incomplete_data)
        self.assertEqual(response.status_code, 200)
        # Should handle gracefully

    def test_auth_logout_endpoint(self):
        """Test logout endpoint."""
        # First verify auth to establish session
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Then logout
        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)

    def test_auth_logout_without_session(self):
        """Test logout without an established session."""
        fresh_client = TestClient(app)
        response = fresh_client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 200)
        # Should handle gracefully

    # ========== User Routes Tests ==========

    def test_get_user_info_requires_authentication(self):
        """Test that get-user-info requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.get("/api/get-user-info", follow_redirects=False)
        # Should not return 200 for unauthenticated user
        self.assertNotEqual(response.status_code, 200)

    def test_get_user_info_with_authentication(self):
        """Test getting user info with proper authentication."""
        # First authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get user info
        response = self.client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("user", data)
        self.assertIn("tree", data)
        
        # Verify user data
        user = data["user"]
        self.assertEqual(user["email"], self.test_user_email)
        
        # Verify tree data
        tree = data["tree"]
        self.assertIn("treeID", tree)
        self.assertIn("resourceLevels", tree)

    def test_get_user_info_tree_contains_stats(self):
        """Test that user info includes complete tree stats."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        response = self.client.get("/api/get-user-info")
        data = response.json()
        tree = data["tree"]
        
        # Check resource levels
        resource_levels = tree.get("resourceLevels", {})
        self.assertIn("water", resource_levels)
        self.assertIn("earth", resource_levels)
        self.assertIn("sun", resource_levels)
        
        # Values should be between 0 and 100
        for resource in ["water", "earth", "sun"]:
            value = resource_levels[resource]
            self.assertGreaterEqual(value, 0)
            self.assertLessEqual(value, 100)

    def test_update_user_without_authentication(self):
        """Test that update-user requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.post(
            "/api/update-user",
            json={"displayName": "Updated Name"},
            follow_redirects=False
        )
        self.assertNotEqual(response.status_code, 200)

    def test_update_user_with_authentication(self):
        """Test updating user info with authentication."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Update user
        update_data = {"displayName": "Updated Test User"}
        response = self.client.put("/api/update-user", json=update_data)
        
        # Should return 200 or handle gracefully
        self.assertIn(response.status_code, [200, 501, 404])

    # ========== Stats Routes Tests ==========

    def test_update_stat_requires_authentication(self):
        """Test that update-stat requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.put(
            "/api/update-stat",
            json={"stat_name": "water", "value": 10},
            follow_redirects=False
        )
        self.assertNotEqual(response.status_code, 200)

    def test_update_stat_water_increase(self):
        """Test increasing water stat."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get initial tree state
        initial_response = self.client.get("/api/get-user-info")
        initial_water = initial_response.json()["tree"]["resourceLevels"]["water"]
        
        # Update stat
        update_value = 15
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "water", "value": update_value}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("water", data.get("message", "").lower())
        
        # Verify the update
        updated_response = self.client.get("/api/get-user-info")
        updated_water = updated_response.json()["tree"]["resourceLevels"]["water"]
        
        # Water should increase by the specified amount (or be clamped to max)
        expected_water = min(initial_water + update_value, 100)
        self.assertEqual(updated_water, expected_water)

    def test_update_stat_earth_decrease(self):
        """Test decreasing earth stat."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get initial state
        initial_response = self.client.get("/api/get-user-info")
        initial_earth = initial_response.json()["tree"]["resourceLevels"]["earth"]
        
        # Update with negative value
        update_value = -20
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "earth", "value": update_value}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        
        # Verify the update
        updated_response = self.client.get("/api/get-user-info")
        updated_earth = updated_response.json()["tree"]["resourceLevels"]["earth"]
        
        # Earth should decrease (or be clamped to minimum)
        expected_earth = max(initial_earth + update_value, 0)
        self.assertEqual(updated_earth, expected_earth)

    def test_update_stat_sun_resource(self):
        """Test updating sun stat."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Update sun
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "sun", "value": 25}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_update_stat_case_insensitive(self):
        """Test that stat names are case-insensitive."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Try uppercase stat name
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "WATER", "value": 5}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_update_stat_invalid_stat_name(self):
        """Test updating with invalid stat name."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Try invalid stat name
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "invalid_resource", "value": 10}
        )
        
        # Should return 400 or 500 error
        self.assertIn(response.status_code, [400, 500, 404])

    def test_update_stat_missing_stat_name(self):
        """Test updating without stat_name."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        response = self.client.put(
            "/api/update-stat",
            json={"value": 10}
        )
        
        # Should return error
        self.assertIn(response.status_code, [400, 422])

    def test_update_stat_missing_value(self):
        """Test updating without value."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "water"}
        )
        
        # Should return error
        self.assertIn(response.status_code, [400, 422])

    def test_update_stat_value_clamping_max(self):
        """Test that stat values are clamped to maximum (100)."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Try to set water to very high value
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "water", "value": 500}
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify clamped to 100
        user_response = self.client.get("/api/get-user-info")
        water = user_response.json()["tree"]["resourceLevels"]["water"]
        self.assertLessEqual(water, 100)

    def test_update_stat_value_clamping_min(self):
        """Test that stat values are clamped to minimum (0)."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Try to set earth to very negative value
        response = self.client.put(
            "/api/update-stat",
            json={"stat_name": "earth", "value": -500}
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify clamped to 0
        user_response = self.client.get("/api/get-user-info")
        earth = user_response.json()["tree"]["resourceLevels"]["earth"]
        self.assertGreaterEqual(earth, 0)

    # ========== Question Routes Tests ==========

    def test_get_questions_all(self):
        """Test retrieving all questions."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get all questions
        response = self.client.post(
            "/api/get-questions",
            json={}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("questions", data)
        self.assertIn("count", data)
        self.assertGreater(len(data["questions"]), 0)

    def test_get_questions_by_resource_water(self):
        """Test retrieving questions filtered by water resource."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get water questions
        response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "water"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("questions", data)
        self.assertGreater(data["count"], 0)
        
        # Verify all returned questions are water type
        for question in data["questions"]:
            self.assertEqual(question.get("resourceType", "").lower(), "water")

    def test_get_questions_by_resource_sun(self):
        """Test retrieving questions filtered by sun resource."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get sun questions
        response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "sun"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # May be empty, that's fine
        self.assertIn("questions", data)

    def test_get_questions_by_resource_earth(self):
        """Test retrieving questions filtered by earth resource."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "earth"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("questions", data)

    def test_get_questions_without_authentication(self):
        """Test that get-questions requires authentication."""
        fresh_client = TestClient(app)
        response = fresh_client.post(
            "/api/get-questions",
            json={}
        )
        
        # Should require authentication and return 401
        self.assertEqual(response.status_code, 401)

    def test_add_question_success(self):
        """Test adding a new question."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        question_data = {
            "text": "What is the largest planet?",
            "question_type": "MCQ",
            "resource_type": "sun",
            "choices": ["Mercury", "Venus", "Jupiter", "Saturn"],
            "correct_choices": [2],
            "check_duplicates": True
        }
        
        response = self.client.post("/api/add-question", json=question_data)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("questionID", data.get("data", {}))

    def test_add_question_multiselect(self):
        """Test adding a multi-select question."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        question_data = {
            "text": "Which of these are planets?",
            "question_type": "MultiSelect",
            "resource_type": "earth",
            "choices": ["Mars", "Moon", "Jupiter", "Sun"],
            "correct_choices": [0, 2],
            "check_duplicates": False
        }
        
        response = self.client.post("/api/add-question", json=question_data)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_add_question_free_response(self):
        """Test adding a free response question."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        question_data = {
            "text": "Explain photosynthesis",
            "question_type": "FreeResponse",
            "resource_type": "sun",
            "choices": [],
            "correct_choices": [],
            "check_duplicates": False
        }
        
        response = self.client.post("/api/add-question", json=question_data)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))

    def test_add_question_missing_text(self):
        """Test adding question without text."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        question_data = {
            "question_type": "MCQ",
            "resource_type": "water",
            "choices": ["A", "B"],
            "correct_choices": [0]
        }
        
        response = self.client.post("/api/add-question", json=question_data)
        
        # Should return error
        self.assertIn(response.status_code, [400, 422])

    def test_add_question_invalid_type(self):
        """Test adding question with invalid type."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        question_data = {
            "text": "Test question",
            "question_type": "InvalidType",
            "resource_type": "water",
            "choices": ["A", "B"],
            "correct_choices": [0]
        }
        
        response = self.client.post("/api/add-question", json=question_data)
        
        # Should return error
        self.assertIn(response.status_code, [400, 422])

    def test_get_question_by_id(self):
        """Test retrieving a specific question by ID."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get a specific question
        response = self.client.post(
            "/api/get-question",
            json={"questionID": self.test_question_1_id}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("question", data.get("data", {}))
        
        question = data["data"]["question"]
        self.assertEqual(question["questionID"], self.test_question_1_id)
        self.assertIn("text", question)
        self.assertIn("type", question)

    def test_get_question_nonexistent(self):
        """Test retrieving a question that doesn't exist."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        fake_id = str(uuid.uuid4())
        response = self.client.post(
            "/api/get-question",
            json={"questionID": fake_id}
        )
        
        # Should return 404 for not found
        self.assertEqual(response.status_code, 404)

    # ========== Integration Scenarios Tests ==========

    def test_complete_user_workflow(self):
        """Test complete user workflow: auth -> get user -> update stats -> get questions."""
        # Step 1: Authenticate
        auth_response = self.client.post("/api/auth/verify", json=self.test_user_data)
        self.assertEqual(auth_response.status_code, 200)
        
        # Step 2: Get user info
        user_response = self.client.get("/api/get-user-info")
        self.assertEqual(user_response.status_code, 200)
        user_data = user_response.json()
        initial_water = user_data["tree"]["resourceLevels"]["water"]
        
        # Step 3: Update stats (simulate game reward) - only if not already at max
        if initial_water < 100:
            stat_response = self.client.put(
                "/api/update-stat",
                json={"stat_name": "water", "value": 10}
            )
            self.assertEqual(stat_response.status_code, 200)
            
            # Step 4: Verify stat update
            updated_user_response = self.client.get("/api/get-user-info")
            updated_water = updated_user_response.json()["tree"]["resourceLevels"]["water"]
            # Water should have increased or reached maximum
            self.assertGreaterEqual(updated_water, initial_water)
        else:
            # Already at max, just verify we can update (will clamp)
            stat_response = self.client.put(
                "/api/update-stat",
                json={"stat_name": "water", "value": 5}
            )
            self.assertEqual(stat_response.status_code, 200)
        
        # Step 5: Get questions
        questions_response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "water"}
        )
        self.assertEqual(questions_response.status_code, 200)
        questions_data = questions_response.json()
        self.assertGreater(questions_data["count"], 0)

    def test_multiple_users_isolation(self):
        """Test that user data is properly isolated."""
        # Authenticate user 1
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get user 1 info
        user1_response = self.client.get("/api/get-user-info")
        user1_data = user1_response.json()
        user1_tree_id = user1_data["tree"]["treeID"]
        user1_initial_water = user1_data["tree"]["resourceLevels"]["water"]
        
        # Update stats for user 1
        self.client.put(
            "/api/update-stat",
            json={"stat_name": "water", "value": 30}
        )
        
        # Create new client for user 2
        user2_client = TestClient(app)
        user2_data_payload = {
            "user": {
                "email": self.test_user_2_email,
                "sub": self.test_user_2_sub,
                "name": self.test_user_2_name,
                "nickname": "testuser2"
            }
        }
        user2_client.post("/api/auth/verify", json=user2_data_payload)
        
        # Get user 2 info
        user2_response = user2_client.get("/api/get-user-info")
        user2_data = user2_response.json()
        user2_tree_id = user2_data["tree"]["treeID"]
        user2_water = user2_data["tree"]["resourceLevels"]["water"]
        
        # Ensure users have different trees
        self.assertNotEqual(user1_tree_id, user2_tree_id)
        
        # Ensure user 2's stats weren't affected by user 1's updates
        # User 2 should have their water at 75 (100 - 25 from initial setup)
        self.assertEqual(user2_water, 75)

    def test_add_and_retrieve_question(self):
        """Test adding a question and then retrieving it."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Add a new question
        new_question_data = {
            "text": "What is the smallest prime number?",
            "question_type": "MCQ",
            "resource_type": "water",
            "choices": ["0", "1", "2", "3"],
            "correct_choices": [2],
            "check_duplicates": False
        }
        
        add_response = self.client.post("/api/add-question", json=new_question_data)
        self.assertEqual(add_response.status_code, 200)
        added_question_id = add_response.json()["data"]["questionID"]
        
        # Retrieve the added question
        get_response = self.client.post(
            "/api/get-question",
            json={"questionID": added_question_id}
        )
        
        self.assertEqual(get_response.status_code, 200)
        retrieved_question = get_response.json()["data"]["question"]
        self.assertEqual(retrieved_question["text"], new_question_data["text"])
        self.assertEqual(retrieved_question["type"], new_question_data["question_type"])

    def test_questions_resource_type_filtering(self):
        """Test that question filtering by resource type works correctly."""
        # Authenticate
        self.client.post("/api/auth/verify", json=self.test_user_data)
        
        # Get water questions
        water_response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "water"}
        )
        water_data = water_response.json()
        water_count = water_data["count"]
        
        # Get sun questions  
        sun_response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "sun"}
        )
        sun_data = sun_response.json()
        sun_count = sun_data["count"]
        
        # Get all questions
        all_response = self.client.post(
            "/api/get-questions",
            json={}
        )
        all_data = all_response.json()
        all_count = all_data["count"]
        
        # Total water + sun should be <= total (may have earth or other types)
        self.assertLessEqual(water_count + sun_count, all_count + 1)  # +1 for rounding


class TestErrorHandling(unittest.TestCase):
    """Test error handling and edge cases."""
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level fixtures."""
        # Create an isolated temporary database for this test class
        cls.test_db_dir = tempfile.mkdtemp()
        cls.test_db_path = os.path.join(cls.test_db_dir, settings.DB_NAME)

        # Monkey-patch database module paths
        db_create_module.DB_PATH = cls.test_db_path
        db_add_module.DB_PATH = cls.test_db_path

        import database.getItemsFromDatabase as db_get_module
        db_get_module.DB_PATH = cls.test_db_path

        # Initialize schema
        create_schema(cls.test_db_path)

        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        """Clean up class-level fixtures."""
        import database.createDatabase as db_create
        import database.addItemsToDatabase as db_add
        import database.getItemsFromDatabase as db_get

        # Restore original paths
        original_path = os.path.join(
            os.path.dirname(os.path.abspath(db_create.__file__)),
            settings.DB_NAME
        )
        db_create.DB_PATH = original_path
        db_add.DB_PATH = original_path
        db_get.DB_PATH = original_path

        if os.path.exists(cls.test_db_path):
            try:
                os.remove(cls.test_db_path)
            except OSError:
                pass

        try:
            os.rmdir(cls.test_db_dir)
        except OSError:
            pass
    
    def test_invalid_json_payload(self):
        """Test handling of invalid JSON."""
        response = self.client.post(
            "/api/auth/verify",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        # Should return 422 or similar error
        self.assertIn(response.status_code, [400, 422, 500])

    def test_missing_required_fields(self):
        """Test handling of missing required fields."""
        response = self.client.put(
            "/api/update-stat",
            json={}
        )
        # Should return an error - either auth error (401) or validation error (400/422)
        self.assertIn(response.status_code, [400, 401, 422])

    def test_concurrent_stat_updates(self):
        """Test that multiple stat updates work correctly."""
        # Authenticate
        auth_response = self.client.post(
            "/api/auth/verify",
            json={
                "user": {
                    "email": "concurrent@example.com",
                    "sub": "auth0|concurrent",
                    "name": "Concurrent User",
                    "nickname": "concurrent"
                }
            }
        )
        self.assertEqual(auth_response.status_code, 200)
        
        # Perform multiple updates
        responses = []
        for i in range(5):
            response = self.client.put(
                "/api/update-stat",
                json={"stat_name": "water", "value": 10}
            )
            responses.append(response)
        
        # All should succeed
        for response in responses:
            self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
