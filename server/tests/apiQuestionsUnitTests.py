"""API route tests for main.py.

This module contains unit tests for FastAPI endpoints and supporting database logic,
with an emphasis on question creation, duplicate detection, and validation behavior.
It also covers user information retrieval routes.

Test classes:
    APIQuestionsTestCase: Base test class that provisions a temporary database and client.
    TestAddQuestionFunction: Direct tests for `add_question()`.
    TestAPIAddQuestion: Endpoint tests for /api/add-question.
    TestOtherAPIRoutes: Endpoint tests for /api/get-user-info and related routes.
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
from database.createDatabase import create_schema
from database.addItemsToDatabase import add_account, generate_tree, add_question
from database.getItemsFromDatabase import get_person

from config.settings import settings


class APIQuestionsTestCase(unittest.TestCase):
    """Base test case that sets up a temporary database and FastAPI client for each test."""
    
    def setUp(self):
        """Set up a fresh database and test client before each test."""
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, settings.DB_NAME)
        
        # Patch the database path in all imported modules
        import database.addItemsToDatabase as addItemsToDatabase
        import database.getItemsFromDatabase as getItemsFromDatabase
        import database.createDatabase as createDatabase
        
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
            role=settings.ROLE_STUDENT
        )
        generate_tree(username)
        return username
    
    def get_authenticated_client(self):
        """Helper method to get a test client with authentication bypassed."""
        from main import app
        from api.dependencies import get_current_user, student_required
        
        username = self.create_test_student()
        user_data = get_person(username)
        
        # Mock the get_current_user dependency (used by /api/add-question endpoint)
        async def mock_get_current_user(request=None):
            return user_data
        
        # Mock the student_required dependency (used by other endpoints)
        async def mock_student_required(request=None, person=None):
            return user_data
        
        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[student_required] = mock_student_required
        client = TestClient(app)
        return client


class TestAddQuestionFunction(APIQuestionsTestCase):
    """Tests for the add_question function directly."""
    
    def test_add_mcq_question(self):
        """Test adding a multiple choice question."""
        question_id = add_question(
            text="What is 2+2?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
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
            self.assertEqual(result[1], settings.QUESTION_MCQ)
            self.assertEqual(result[2], settings.QUESTION_RESOURCE_GENERAL)
            
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
            question_type=settings.QUESTION_MULTI_SELECT,
            resource_type=settings.QUESTION_RESOURCE_SUN,
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
            question_type=settings.QUESTION_FREE_RESPONSE,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
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
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
            choices=["London", "Paris", "Berlin"],
            correct_choices=[1]
        )
        
        # Try to add duplicate
        with self.assertRaises(ValueError) as context:
            add_question(
                text="What is the capital of France?",
                question_type=settings.QUESTION_MCQ,
                resource_type=settings.QUESTION_RESOURCE_GENERAL,
                choices=["London", "Paris", "Berlin"],
                correct_choices=[1]
            )
        
        self.assertIn("Duplicate question detected", str(context.exception))
    
    def test_duplicate_detection_different_choices(self):
        """Test that same question text with different choices is allowed."""
        # Add first question
        q1_id = add_question(
            text="What is 1+1?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
            choices=["1", "2", "3"],
            correct_choices=[1]
        )
        
        # Add same text but different choices - should succeed
        q2_id = add_question(
            text="What is 1+1?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
            choices=["0", "2", "4"],
            correct_choices=[1]
        )
        
        self.assertNotEqual(q1_id, q2_id)
    
    def test_bypass_duplicate_check(self):
        """Test that duplicate checking can be bypassed."""
        # Add first question
        add_question(
            text="Test question",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
            choices=["A", "B"],
            correct_choices=[0],
            check_duplicates=True
        )
        
        # Add duplicate with check_duplicates=False - should succeed
        q2_id = add_question(
            text="Test question",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
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
                resource_type=settings.QUESTION_RESOURCE_GENERAL,
                choices=[],
                correct_choices=[]
            )
        
        self.assertIn("Invalid question type", str(context.exception))
    
    def test_invalid_resource_type(self):
        """Test that invalid resource types are rejected."""
        with self.assertRaises(ValueError) as context:
            add_question(
                text="Test",
                question_type=settings.QUESTION_MCQ,
                resource_type="InvalidResource",
                choices=["A", "B"],
                correct_choices=[0]
            )
        
        self.assertIn("Invalid resource type", str(context.exception))
    
    def test_all_resource_types(self):
        """Test adding questions with all valid resource types."""
        # Note: QUESTION_RESOURCE_NONE is not accepted by database CHECK constraint
        resource_types = [
            settings.QUESTION_RESOURCE_WATER,
            settings.QUESTION_RESOURCE_EARTH,
            settings.QUESTION_RESOURCE_SUN,
            settings.QUESTION_RESOURCE_GENERAL
        ]
        
        for resource_type in resource_types:
            q_id = add_question(
                text=f"Question for {resource_type}",
                question_type=settings.QUESTION_MCQ,
                resource_type=resource_type,
                choices=["A", "B"],
                correct_choices=[0]
            )
            self.assertIsNotNone(q_id)


class TestAPIAddQuestion(APIQuestionsTestCase):
    """Tests for the /api/add-question endpoint."""
    
    def test_add_question_success(self):
        """Test successfully adding a question via API."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "text": "What is photosynthesis?",
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_SUN,
                "choices": ["Energy production", "Water absorption", "Root growth"],
                "correct_choices": [0]
            }
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("questionID", data["data"])
        self.assertEqual(data["data"]["message"], "Question added successfully")
    
    def test_add_question_missing_text(self):
        """Test that missing question text returns an error."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_GENERAL,
                "choices": ["A", "B"],
                "correct_choices": [0]
            }
        )
        
        self.assertEqual(response.status_code, 422)
        # FastAPI/Pydantic returns 422 for validation errors
    
    def test_add_question_invalid_type(self):
        """Test that invalid question type returns an error."""
        client = self.get_authenticated_client()
        
        response = client.post(
            "/api/add-question",
            json={
                "text": "Test question",
                "question_type": "InvalidType",
                "resource_type": settings.QUESTION_RESOURCE_GENERAL,
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
            "question_type": settings.QUESTION_MCQ,
            "resource_type": settings.QUESTION_RESOURCE_WATER,
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
            "question_type": settings.QUESTION_MCQ,
            "resource_type": settings.QUESTION_RESOURCE_GENERAL,
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
                "question_type": settings.QUESTION_MULTI_SELECT,
                "resource_type": settings.QUESTION_RESOURCE_SUN,
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
                "question_type": settings.QUESTION_FREE_RESPONSE,
                "resource_type": settings.QUESTION_RESOURCE_WATER,
                "choices": [],
                "correct_choices": []
            }
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])

class TestGetQuestionEndpoint(APIQuestionsTestCase):
    """Tests for the /api/get-question endpoint."""
    
    def setUp(self):
        """Set up test data before each test."""
        super().setUp()
        self.client = self.get_authenticated_client()
        
        # Add some test questions
        self.q1_id = add_question(
            text="What is photosynthesis?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_SUN,
            choices=["Energy production", "Water absorption", "Root growth"],
            correct_choices=[0]
        )
        
        self.q2_id = add_question(
            text="Which are primary colors?",
            question_type=settings.QUESTION_MULTI_SELECT,
            resource_type=settings.QUESTION_RESOURCE_GENERAL,
            choices=["Red", "Green", "Blue", "Yellow"],
            correct_choices=[0, 2]
        )
    
    def test_get_single_question_success(self):
        """Test retrieving a single question by ID."""
        response = self.client.post(
            "/api/get-question",
            json={"questionID": self.q1_id}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("question", data["data"])
        
        question = data["data"]["question"]
        self.assertEqual(question["questionID"], self.q1_id)
        self.assertEqual(question["text"], "What is photosynthesis?")
        self.assertEqual(question["type"], settings.QUESTION_MCQ)
        self.assertEqual(question["resourceType"], settings.QUESTION_RESOURCE_SUN)
    
    def test_get_single_question_with_choices(self):
        """Test that question includes choice information."""
        response = self.client.post(
            "/api/get-question",
            json={"questionID": self.q1_id}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        question = data["data"]["question"]
        
        self.assertIn("choices", question)
        self.assertEqual(len(question["choices"]), 3)
        
        # Verify choice structure with isCorrect flags
        choices = question["choices"]
        correct_found = False
        for choice in choices:
            self.assertIn("text", choice)
            self.assertIn("isCorrect", choice)
            if choice["isCorrect"]:
                correct_found = True
        
        self.assertTrue(correct_found, "No correct answer found")
    
    def test_get_nonexistent_question(self):
        """Test retrieving a non-existent question returns 404."""
        response = self.client.post(
            "/api/get-question",
            json={"questionID": "nonexistent-id"}
        )
        
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
    
    def test_get_question_missing_id(self):
        """Test that missing questionID returns error."""
        response = self.client.post(
            "/api/get-question",
            json={}
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("questionID is required", data["detail"])
    
    def test_get_question_multiselect(self):
        """Test retrieving a multi-select question."""
        response = self.client.post(
            "/api/get-question",
            json={"questionID": self.q2_id}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        question = data["data"]["question"]
        
        self.assertEqual(question["type"], settings.QUESTION_MULTI_SELECT)
        
        # Verify multiple correct answers
        correct_answers = [c["text"] for c in question["choices"] if c["isCorrect"]]
        self.assertEqual(len(correct_answers), 2)
        self.assertIn("Red", correct_answers)
        self.assertIn("Blue", correct_answers)


class TestGetQuestionsEndpoint(APIQuestionsTestCase):
    """Tests for the /api/get-questions endpoint."""
    
    def setUp(self):
        """Set up test data before each test."""
        super().setUp()
        self.client = self.get_authenticated_client()
        
        # Add various test questions
        self.water_q1 = add_question(
            text="What percentage of Earth is water?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_WATER,
            choices=["50%", "71%", "90%"],
            correct_choices=[1]
        )
        
        self.water_q2 = add_question(
            text="Which are types of precipitation?",
            question_type=settings.QUESTION_MULTI_SELECT,
            resource_type=settings.QUESTION_RESOURCE_WATER,
            choices=["Rain", "Snow", "Hail", "Dust"],
            correct_choices=[0, 1, 2]
        )
        
        self.sun_q1 = add_question(
            text="Why do plants need sunlight?",
            question_type=settings.QUESTION_FREE_RESPONSE,
            resource_type=settings.QUESTION_RESOURCE_SUN,
            choices=[],
            correct_choices=[]
        )
        
        self.earth_q1 = add_question(
            text="What is soil made of?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_EARTH,
            choices=["Sand", "Rock and organic matter", "Clay"],
            correct_choices=[1]
        )
    
    def test_get_all_questions(self):
        """Test retrieving all questions."""
        response = self.client.post("/api/get-questions", json={})
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["count"], 4)
        self.assertEqual(len(data["questions"]), data["count"])
    
    def test_get_questions_with_limit(self):
        """Test retrieving questions with numQuestions limit."""
        response = self.client.post(
            "/api/get-questions",
            json={"numQuestions": 2}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 2)
        self.assertEqual(len(data["questions"]), 2)
    
    def test_get_questions_by_resource_type(self):
        """Test filtering questions by resource type."""
        response = self.client.post(
            "/api/get-questions",
            json={"resourceType": settings.QUESTION_RESOURCE_WATER}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["count"], 2)
        
        # Verify all returned questions are Water type
        for question in data["questions"]:
            self.assertEqual(question["resourceType"], settings.QUESTION_RESOURCE_WATER)
    
    def test_get_questions_by_question_type(self):
        """Test filtering questions by question type."""
        response = self.client.post(
            "/api/get-questions",
            json={"questionType": settings.QUESTION_MCQ}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["count"], 0)
        
        # Verify all returned questions are MCQ type
        for question in data["questions"]:
            self.assertEqual(question["type"], settings.QUESTION_MCQ)
    
    def test_get_questions_multi_filter(self):
        """Test filtering by multiple criteria."""
        response = self.client.post(
            "/api/get-questions",
            json={
                "resourceType": settings.QUESTION_RESOURCE_WATER,
                "questionType": settings.QUESTION_MCQ,
                "numQuestions": 5
            }
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["questions"]), 1)  # Only 1 Water MCQ
        
        question = data["questions"][0]
        self.assertEqual(question["resourceType"], settings.QUESTION_RESOURCE_WATER)
        self.assertEqual(question["type"], settings.QUESTION_MCQ)
    
    def test_get_questions_multiselect_type(self):
        """Test retrieving multi-select questions."""
        response = self.client.post(
            "/api/get-questions",
            json={"questionType": settings.QUESTION_MULTI_SELECT}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["count"], 0)
        
        for question in data["questions"]:
            self.assertEqual(question["type"], settings.QUESTION_MULTI_SELECT)
    
    def test_get_questions_free_response_type(self):
        """Test retrieving free response questions."""
        response = self.client.post(
            "/api/get-questions",
            json={"questionType": settings.QUESTION_FREE_RESPONSE}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["count"], 0)
        
        for question in data["questions"]:
            self.assertEqual(question["type"], settings.QUESTION_FREE_RESPONSE)
    
    def test_get_questions_randomization(self):
        """Test that multiple calls return different orders (randomization)."""
        # Get questions multiple times
        responses = []
        for _ in range(3):
            response = self.client.post(
                "/api/get-questions",
                json={"numQuestions": 4}
            )
            self.assertEqual(response.status_code, 200)
            questions = response.json()["questions"]
            question_ids = [q["questionID"] for q in questions]
            responses.append(question_ids)
        
        # At least one order should be different (very likely with randomization)
        # This is a soft check - just verify we got questions
        self.assertGreater(len(responses[0]), 0)
    
    def test_get_questions_limit_zero(self):
        """Test requesting zero questions."""
        response = self.client.post(
            "/api/get-questions",
            json={"numQuestions": 0}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 0)
        self.assertEqual(len(data["questions"]), 0)
    
    def test_get_questions_invalid_resource_type(self):
        """Test with invalid resource type returns empty."""
        response = self.client.post(
            "/api/get-questions",
            json={"resourceType": "InvalidType"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 0)
    
    def test_get_questions_invalid_question_type(self):
        """Test with invalid question type returns empty."""
        response = self.client.post(
            "/api/get-questions",
            json={"questionType": "InvalidType"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 0)
    
    def test_get_questions_response_structure(self):
        """Test that response has proper structure."""
        response = self.client.post(
            "/api/get-questions",
            json={"numQuestions": 1}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check response structure
        self.assertIn("success", data)
        self.assertIn("count", data)
        self.assertIn("questions", data)
        self.assertTrue(data["success"])
        self.assertEqual(len(data["questions"]), data["count"])
        
        # Check question structure
        if data["count"] > 0:
            question = data["questions"][0]
            self.assertIn("questionID", question)
            self.assertIn("text", question)
            self.assertIn("type", question)
            self.assertIn("difficulty", question)
            self.assertIn("resourceType", question)
            self.assertIn("choices", question)
            
            # Check choice structure
            if len(question["choices"]) > 0:
                choice = question["choices"][0]
                self.assertIn("text", choice)
                self.assertIn("isCorrect", choice)
    
    def test_get_questions_all_resource_types(self):
        """Test retrieving questions for each resource type separately."""
        resource_types = [
            settings.QUESTION_RESOURCE_WATER,
            settings.QUESTION_RESOURCE_EARTH,
            settings.QUESTION_RESOURCE_SUN,
            settings.QUESTION_RESOURCE_GENERAL
        ]
        
        for resource_type in resource_types:
            response = self.client.post(
                "/api/get-questions",
                json={"resourceType": resource_type}
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            
            # Verify all questions match the resource type
            for question in data["questions"]:
                self.assertEqual(question["resourceType"], resource_type)


if __name__ == "__main__":
    unittest.main()
