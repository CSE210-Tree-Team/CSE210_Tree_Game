"""Unit tests for questions router.

This module contains isolated unit tests for question management endpoints,
with all external dependencies mocked.

Test classes:
    TestAddQuestion: Tests for the /api/add-question endpoint
    TestGetQuestion: Tests for the /api/get-question endpoint
    TestGetQuestions: Tests for the /api/get-questions endpoint
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from api.__test__.test_helpers import create_test_app
from config.settings import settings


class TestAddQuestion(unittest.TestCase):
    """Tests for add_question endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_user = {
            "username": "test@example.com",
            "email": "test@example.com",
            "displayName": "Test User",
            "roles": [settings.ROLE_STUDENT]
        }

    def test_add_question_mcq_success(self):
        """Test successfully adding an MCQ question."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.return_value = "question-uuid-123"
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "What is 2+2?",
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_SUN,
                "choices": ["4", "5", "6"],
                "correct_choices": [0],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertIn("data", data)
            self.assertEqual(data["data"]["questionID"], "question-uuid-123")

    def test_add_question_multi_select_success(self):
        """Test successfully adding a MultiSelect question."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.return_value = "question-uuid-456"
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "Select all correct answers",
                "question_type": settings.QUESTION_MULTI_SELECT,
                "resource_type": settings.QUESTION_RESOURCE_WATER,
                "choices": ["A", "B", "C"],
                "correct_choices": [0, 1],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 200)

    def test_add_question_free_response_success(self):
        """Test successfully adding a FreeResponse question."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.return_value = "question-uuid-789"
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "Explain your answer",
                "question_type": settings.QUESTION_FREE_RESPONSE,
                "resource_type": settings.QUESTION_RESOURCE_EARTH,
                "choices": [],
                "correct_choices": [],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 200)

    def test_add_question_general_resource_type(self):
        """Test adding question with general resource type."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.return_value = "question-uuid-123"
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "General question",
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_GENERAL,
                "choices": ["A", "B"],
                "correct_choices": [0],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 200)

    def test_add_question_none_resource_type(self):
        """Test adding question with none resource type."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.return_value = "question-uuid-123"
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "No resource question",
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_NONE,
                "choices": ["A", "B"],
                "correct_choices": [0],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 200)

    def test_add_question_invalid_type(self):
        """Test adding a question with invalid type raises 400 error."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.side_effect = ValueError("Invalid question type")
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "What is 2+2?",
                "question_type": "INVALID",
                "resource_type": settings.QUESTION_RESOURCE_SUN,
                "choices": ["4", "5", "6"],
                "correct_choices": [0],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 400)

    def test_add_question_service_exception(self):
        """Test adding a question with service exception returns 500 error."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.side_effect = Exception("Database error")
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "What is 2+2?",
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_SUN,
                "choices": ["4", "5", "6"],
                "correct_choices": [0],
                "check_duplicates": True
            }
            
            response = client.post("/api/add-question", json=question_data)
            
            self.assertEqual(response.status_code, 500)

    def test_add_question_calls_service_with_correct_params(self):
        """Test that add_question calls QuestionService with correct parameters."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.add_new_question.return_value = "question-uuid-123"
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            question_data = {
                "text": "What is 2+2?",
                "question_type": settings.QUESTION_MCQ,
                "resource_type": settings.QUESTION_RESOURCE_SUN,
                "choices": ["4", "5", "6"],
                "correct_choices": [0],
                "check_duplicates": True
            }
            
            client.post("/api/add-question", json=question_data)
            
            # Verify QuestionService.add_new_question was called with correct params
            mock_qs.add_new_question.assert_called_once()
            call_args = mock_qs.add_new_question.call_args
            self.assertEqual(call_args.kwargs["text"], "What is 2+2?")
            self.assertEqual(call_args.kwargs["question_type"], settings.QUESTION_MCQ)
            self.assertEqual(call_args.kwargs["resource_type"], settings.QUESTION_RESOURCE_SUN)


class TestGetQuestion(unittest.TestCase):
    """Tests for get_question endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        app = create_test_app()
        self.mock_user = {
            "username": "test@example.com",
            "email": "test@example.com",
            "displayName": "Test User",
            "roles": [settings.ROLE_STUDENT]
        }

    def test_get_question_success(self):
        """Test successfully retrieving a question."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            question_data = {
                "questionID": "q-123",
                "text": "What is 2+2?",
                "choices": ["4", "5", "6"],
                "correct_choices": [0]
            }
            mock_qs.get_question_by_id.return_value = question_data
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-question", json={"questionID": "q-123"})
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["data"]["question"]["questionID"], "q-123")

    def test_get_question_missing_id(self):
        """Test getting question with missing ID returns 400 error."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-question", json={})
            
            self.assertEqual(response.status_code, 400)

    def test_get_question_not_found(self):
        """Test getting non-existent question returns 404 error."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_question_by_id.return_value = None
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-question", json={"questionID": "nonexistent"})
            
            self.assertEqual(response.status_code, 404)

    def test_get_question_service_error(self):
        """Test getting question with service error returns 500."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_question_by_id.side_effect = Exception("Database error")
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-question", json={"questionID": "q-123"})
            
            self.assertEqual(response.status_code, 500)


class TestGetQuestions(unittest.TestCase):
    """Tests for get_questions endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        app = create_test_app()
        self.mock_user = {
            "username": "test@example.com",
            "email": "test@example.com",
            "displayName": "Test User",
            "roles": [settings.ROLE_STUDENT]
        }

    def test_get_questions_success(self):
        """Test successfully retrieving questions."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            questions = [
                {
                    "questionID": "q-1",
                    "text": "Question 1",
                    "type": settings.QUESTION_MCQ,
                    "difficulty": 1,
                    "resourceType": settings.QUESTION_RESOURCE_WATER,
                    "choices": [
                        {"text": "Choice 1", "isCorrect": True},
                        {"text": "Choice 2", "isCorrect": False}
                    ]
                }
            ]
            mock_qs.get_filtered_questions.return_value = questions
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-questions", json={
                "numQuestions": 5,
                "resourceType": settings.QUESTION_RESOURCE_WATER,
                "questionType": settings.QUESTION_MCQ,
                "difficulty": 1
            })
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["count"], 1)

    def test_get_questions_all_resource_types(self):
        """Test getting questions with different resource types."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_filtered_questions.return_value = []
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            # Test with each resource type
            for resource_type in [settings.QUESTION_RESOURCE_WATER, settings.QUESTION_RESOURCE_EARTH, 
                                 settings.QUESTION_RESOURCE_SUN, settings.QUESTION_RESOURCE_GENERAL, 
                                 settings.QUESTION_RESOURCE_NONE]:
                response = client.post("/api/get-questions", json={
                    "resourceType": resource_type
                })
                self.assertEqual(response.status_code, 200)

    def test_get_questions_all_question_types(self):
        """Test getting questions with different question types."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_filtered_questions.return_value = []
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            # Test with each question type
            for question_type in [settings.QUESTION_MCQ, settings.QUESTION_FREE_RESPONSE, 
                                  settings.QUESTION_MULTI_SELECT]:
                response = client.post("/api/get-questions", json={
                    "questionType": question_type
                })
                self.assertEqual(response.status_code, 200)

    def test_get_questions_no_filters(self):
        """Test getting questions without filters."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_filtered_questions.return_value = []
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-questions", json={})
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["count"], 0)

    def test_get_questions_service_error(self):
        """Test getting questions with service error returns 500."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_filtered_questions.side_effect = Exception("Database error")
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            response = client.post("/api/get-questions", json={})
            
            self.assertEqual(response.status_code, 500)

    def test_get_questions_calls_service_with_filters(self):
        """Test that get_questions passes filters to service."""
        with patch('api.routers.questions.QuestionService') as mock_qs, \
             patch('api.routers.questions.get_current_user') as mock_get_user:
            
            mock_qs.get_filtered_questions.return_value = []
            mock_get_user.return_value = self.mock_user
            
            app = create_test_app()
            from api.routers.questions import router
            app.include_router(router)
            
            client = TestClient(app)
            
            client.post("/api/get-questions", json={
                "numQuestions": 10,
                "resourceType": settings.QUESTION_RESOURCE_SUN,
                "questionType": settings.QUESTION_FREE_RESPONSE,
                "difficulty": 2
            })
            
            # Verify QuestionService.get_filtered_questions was called
            mock_qs.get_filtered_questions.assert_called_once()
            call_args = mock_qs.get_filtered_questions.call_args
            self.assertEqual(call_args.kwargs["num_questions"], 10)
            self.assertEqual(call_args.kwargs["resource_type"], settings.QUESTION_RESOURCE_SUN)


if __name__ == "__main__":
    unittest.main()
