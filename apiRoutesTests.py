"""
API Routes Unit Tests

Comprehensive unit tests for the FastAPI routes in main.py, particularly focusing on 
the api_add_question endpoint and question management functionality.

Tests are specifically focused on the file: main.py and its API routes.

Test Classes:
    APIRoutesTestCase: Base test class with database and FastAPI client setup/teardown.
    TestAddQuestionFunction: Direct tests for the add_question() function.
    TestAPIAddQuestion: API endpoint tests for /api/add-question.
    TestOtherAPIRoutes: Tests for other API endpoints like /api/get-user-info.

Total Unit Tests: 17
Coverage: Question addition (MCQ, MultiSelect, FreeResponse), duplicate detection,
          input validation, error handling, and user information retrieval.

Note: Created this file was created with assistance from Gemini
"""

import sqlite3
import os
import sys
import tempfile
import shutil
import unittest
from fastapi.testclient import TestClient

# Add parent directory to path to import constants and other modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the modules to test
from Database.createDatabase import create_schema
from Database.addItemsToDatabase import add_account, generate_tree, add_question
from Database.getItemsFromDatabase import get_person

from constants import (
    DB_NAME, ROLE_STUDENT, QUESTION_MCQ, QUESTION_FREE_RESPONSE, QUESTION_MULTI_SELECT,
    QUESTION_RESOURCE_WATER, QUESTION_RESOURCE_EARTH, QUESTION_RESOURCE_SUN,
    QUESTION_RESOURCE_GENERAL
)


class APIRoutesTestCase(unittest.TestCase):
    """Base test case that sets up a temporary database and FastAPI client for each test."""
    
    def setUp(self):
        """Set up a fresh database and test client before each test."""
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, DB_NAME)
        
        # Patch the database path in all imported modules
        import Database.addItemsToDatabase as addItemsToDatabase
        import Database.getItemsFromDatabase as getItemsFromDatabase
        import Database.createDatabase as createDatabase
        
        addItemsToDatabase.DB_PATH = self.db_path
        getItemsFromDatabase.DB_PATH = self.db_path
        createDatabase.DB_PATH = self.db_path
        
        # Create schema for this test
        create_schema(self.db_path)
    
    def tearDown(self):
        """Clean up the temporary directory after each test."""
        shutil.rmtree(self.test_dir)
    
    def create_test_student(self):
        """Helper method to create a test student account."""
        username = "test_student@example.com"
        add_account(
            username=username,
            email=username,
            passwordHash="test_hash",
            displayName="Test Student",
            accountReference="test_ref",
            dateOfBirth="2000-01-01",
            role=ROLE_STUDENT
        )
        generate_tree(username)
        return username
    
    def get_authenticated_client(self):
        """Helper method to get a test client with authentication bypassed."""
        from main import app, student_required
        
        username = self.create_test_student()
        
        # Mock the student_required dependency
        async def mock_student_required():
            return get_person(username)
        
        app.dependency_overrides[student_required] = mock_student_required
        client = TestClient(app)
        return client


class TestAddQuestionFunction(APIRoutesTestCase):
    """Tests for the add_question function directly."""
    
    def test_add_mcq_question(self):
        """Test adding a multiple choice question."""
        question_id = add_question(
            text="What is 2+2?",
            question_type=QUESTION_MCQ,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=["3", "4", "5"],
            correct_choices=[1]
        )
        
        self.assertIsNotNone(question_id)
        
        # Verify in database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT text, type, resourceType FROM Question WHERE questionID = ?", (question_id,))
            result = cursor.fetchone()
            self.assertIsNotNone(result)
            self.assertEqual(result[0], "What is 2+2?")
            self.assertEqual(result[1], QUESTION_MCQ)
            self.assertEqual(result[2], QUESTION_RESOURCE_GENERAL)
            
            # Check choices
            cursor.execute("SELECT text, isCorrect FROM QuestionChoice WHERE questionID = ? ORDER BY text", (question_id,))
            choices = cursor.fetchall()
            self.assertEqual(len(choices), 3)
            self.assertIn(("4", 1), choices)
            self.assertIn(("3", 0), choices)
            self.assertIn(("5", 0), choices)
    
    def test_add_multiselect_question(self):
        """Test adding a multi-select question with multiple correct answers."""
        question_id = add_question(
            text="Which are primary colors?",
            question_type=QUESTION_MULTI_SELECT,
            resource_type=QUESTION_RESOURCE_SUN,
            choices=["Red", "Green", "Blue", "Yellow"],
            correct_choices=[0, 2]  # Red and Blue
        )
        
        self.assertIsNotNone(question_id)
        
        # Verify correct answers
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT text FROM QuestionChoice WHERE questionID = ? AND isCorrect = 1", (question_id,))
            correct = [row[0] for row in cursor.fetchall()]
            self.assertIn("Red", correct)
            self.assertIn("Blue", correct)
            self.assertEqual(len(correct), 2)
    
    def test_add_free_response_question(self):
        """Test adding a free response question without choices."""
        question_id = add_question(
            text="Explain photosynthesis.",
            question_type=QUESTION_FREE_RESPONSE,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=[],
            correct_choices=[]
        )
        
        self.assertIsNotNone(question_id)
        
        # Verify no choices were added
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM QuestionChoice WHERE questionID = ?", (question_id,))
            count = cursor.fetchone()[0]
            self.assertEqual(count, 0)
    
    def test_duplicate_detection(self):
        """Test that duplicate questions are detected and rejected."""
        # Add first question
        add_question(
            text="What is the capital of France?",
            question_type=QUESTION_MCQ,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=["London", "Paris", "Berlin"],
            correct_choices=[1]
        )
        
        # Try to add duplicate
        with self.assertRaises(ValueError) as context:
            add_question(
                text="What is the capital of France?",
                question_type=QUESTION_MCQ,
                resource_type=QUESTION_RESOURCE_GENERAL,
                choices=["London", "Paris", "Berlin"],
                correct_choices=[1]
            )
        
        self.assertIn("Duplicate question detected", str(context.exception))
    
    def test_duplicate_detection_different_choices(self):
        """Test that same question text with different choices is allowed."""
        # Add first question
        q1_id = add_question(
            text="What is 1+1?",
            question_type=QUESTION_MCQ,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=["1", "2", "3"],
            correct_choices=[1]
        )
        
        # Add same text but different choices - should succeed
        q2_id = add_question(
            text="What is 1+1?",
            question_type=QUESTION_MCQ,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=["0", "2", "4"],
            correct_choices=[1]
        )
        
        self.assertNotEqual(q1_id, q2_id)
    
    def test_bypass_duplicate_check(self):
        """Test that duplicate checking can be bypassed."""
        # Add first question
        add_question(
            text="Test question",
            question_type=QUESTION_MCQ,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=["A", "B"],
            correct_choices=[0],
            check_duplicates=True
        )
        
        # Add duplicate with check_duplicates=False - should succeed
        q2_id = add_question(
            text="Test question",
            question_type=QUESTION_MCQ,
            resource_type=QUESTION_RESOURCE_GENERAL,
            choices=["A", "B"],
            correct_choices=[0],
            check_duplicates=False
        )
        
        self.assertIsNotNone(q2_id)
    
    def test_invalid_question_type(self):
        """Test that invalid question types are rejected."""
        with self.assertRaises(ValueError) as context:
            add_question(
                text="Test",
                question_type="InvalidType",
                resource_type=QUESTION_RESOURCE_GENERAL,
                choices=[],
                correct_choices=[]
            )
        
        self.assertIn("Invalid question type", str(context.exception))
    
    def test_invalid_resource_type(self):
        """Test that invalid resource types are rejected."""
        with self.assertRaises(ValueError) as context:
            add_question(
                text="Test",
                question_type=QUESTION_MCQ,
                resource_type="InvalidResource",
                choices=["A", "B"],
                correct_choices=[0]
            )
        
        self.assertIn("Invalid resource type", str(context.exception))
    
    def test_all_resource_types(self):
        """Test adding questions with all valid resource types."""
        # Note: QUESTION_RESOURCE_NONE is not accepted by database CHECK constraint
        resource_types = [
            QUESTION_RESOURCE_WATER,
            QUESTION_RESOURCE_EARTH,
            QUESTION_RESOURCE_SUN,
            QUESTION_RESOURCE_GENERAL
        ]
        
        for resource_type in resource_types:
            q_id = add_question(
                text=f"Question for {resource_type}",
                question_type=QUESTION_MCQ,
                resource_type=resource_type,
                choices=["A", "B"],
                correct_choices=[0]
            )
            self.assertIsNotNone(q_id)


class TestAPIAddQuestion(APIRoutesTestCase):
    """Tests for the /api/add-question endpoint."""
    
    def test_add_question_success(self):
        """Test successfully adding a question via API."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "text": "What is photosynthesis?",
                "question_type": QUESTION_MCQ,
                "resource_type": QUESTION_RESOURCE_SUN,
                "choices": ["Energy production", "Water absorption", "Root growth"],
                "correct_choices": [0]
            }
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("questionID", data)
        self.assertEqual(data["message"], "Question added successfully")
    
    def test_add_question_missing_text(self):
        """Test that missing question text returns an error."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "question_type": QUESTION_MCQ,
                "resource_type": QUESTION_RESOURCE_GENERAL,
                "choices": ["A", "B"],
                "correct_choices": [0]
            }
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Question text is required", response.json()["detail"])
    
    def test_add_question_invalid_type(self):
        """Test that invalid question type returns an error."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "text": "Test question",
                "question_type": "InvalidType",
                "resource_type": QUESTION_RESOURCE_GENERAL,
                "choices": ["A", "B"],
                "correct_choices": [0]
            }
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid question type", response.json()["detail"])
    
    def test_add_question_duplicate(self):
        """Test that duplicate questions are rejected."""
        client = self.get_authenticated_client()
        
        question_data = {
            "text": "What is H2O?",
            "question_type": QUESTION_MCQ,
            "resource_type": QUESTION_RESOURCE_WATER,
            "choices": ["Water", "Air", "Fire"],
            "correct_choices": [0]
        }
        
        # Add first time - should succeed
        response1 = client.post("/api/add-question", json=question_data)
        self.assertEqual(response1.status_code, 200)
        
        # Add second time - should fail
        response2 = client.post("/api/add-question", json=question_data)
        self.assertEqual(response2.status_code, 400)
        self.assertIn("Duplicate question detected", response2.json()["detail"])
    
    def test_add_question_bypass_duplicate_check(self):
        """Test that duplicate checking can be bypassed via API."""
        client = self.get_authenticated_client()
        
        question_data = {
            "text": "Duplicate test",
            "question_type": QUESTION_MCQ,
            "resource_type": QUESTION_RESOURCE_GENERAL,
            "choices": ["A", "B"],
            "correct_choices": [0]
        }
        
        # Add first time
        response1 = client.post("/api/add-question", json=question_data)
        self.assertEqual(response1.status_code, 200)
        
        # Add second time with check_duplicates=False
        question_data["check_duplicates"] = False
        response2 = client.post("/api/add-question", json=question_data)
        self.assertEqual(response2.status_code, 200)
    
    def test_add_multiselect_via_api(self):
        """Test adding a multi-select question via API."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "text": "Select all renewable energy sources:",
                "question_type": QUESTION_MULTI_SELECT,
                "resource_type": QUESTION_RESOURCE_SUN,
                "choices": ["Solar", "Coal", "Wind", "Oil"],
                "correct_choices": [0, 2]  # Solar and Wind
            }
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
    
    def test_add_free_response_via_api(self):
        """Test adding a free response question via API."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "text": "Describe the water cycle.",
                "question_type": QUESTION_FREE_RESPONSE,
                "resource_type": QUESTION_RESOURCE_WATER,
                "choices": [],
                "correct_choices": []
            }
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])


class TestOtherAPIRoutes(APIRoutesTestCase):
    """Tests for other API routes."""
    
    def test_get_user_info(self):
        """Test the /api/get-user-info endpoint."""
        client = self.get_authenticated_client()
        
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("username", data)
        self.assertIn("treeID", data)
        self.assertIn("resourceLevels", data)
        self.assertIn("displayName", data)


if __name__ == "__main__":
    unittest.main()
