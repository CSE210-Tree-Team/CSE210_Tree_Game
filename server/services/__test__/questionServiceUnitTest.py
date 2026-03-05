"""Unit tests for question service.

This module contains isolated unit tests for QuestionService,
with all external dependencies mocked.
"""

import unittest
from unittest.mock import patch
from config.settings import settings
from services.question_service import QuestionService


class TestQuestionService(unittest.TestCase):
    """Tests for QuestionService."""

    @patch("services.question_service.add_question")
    def test_add_new_question_passes_arguments(self, mock_add_question):
        """Test add_new_question forwards all parameters to data layer."""
        mock_add_question.return_value = "question-uuid-123"

        result = QuestionService.add_new_question(
            text="What is photosynthesis?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_SUN,
            choices=["A", "B"],
            correct_choices=[0],
            check_duplicates=True
        )

        self.assertEqual(result, "question-uuid-123")
        mock_add_question.assert_called_once_with(
            text="What is photosynthesis?",
            question_type=settings.QUESTION_MCQ,
            resource_type=settings.QUESTION_RESOURCE_SUN,
            choices=["A", "B"],
            correct_choices=[0],
            check_duplicates=True
        )

    @patch("services.question_service.add_question")
    def test_add_new_question_uses_default_duplicate_check(self, mock_add_question):
        """Test add_new_question uses check_duplicates=True by default."""
        mock_add_question.return_value = "question-uuid-456"

        QuestionService.add_new_question(
            text="Explain soil layers",
            question_type=settings.QUESTION_FREE_RESPONSE,
            resource_type=settings.QUESTION_RESOURCE_EARTH,
            choices=[],
            correct_choices=[]
        )

        self.assertEqual(mock_add_question.call_args.kwargs["check_duplicates"], True)

    @patch("services.question_service.get_question")
    def test_get_question_by_id_found(self, mock_get_question):
        """Test get_question_by_id returns question dictionary when present."""
        mock_get_question.return_value = {
            "questionID": "question-uuid-123",
            "text": "Water cycle question",
            "resourceType": settings.QUESTION_RESOURCE_WATER
        }

        question = QuestionService.get_question_by_id("question-uuid-123")

        self.assertEqual(question["questionID"], "question-uuid-123")
        self.assertEqual(question["resourceType"], settings.QUESTION_RESOURCE_WATER)
        mock_get_question.assert_called_once_with("question-uuid-123")

    @patch("services.question_service.get_question")
    def test_get_question_by_id_not_found(self, mock_get_question):
        """Test get_question_by_id returns None when missing."""
        mock_get_question.return_value = None

        question = QuestionService.get_question_by_id("missing-id")

        self.assertIsNone(question)

    @patch("services.question_service.get_questions")
    def test_get_filtered_questions_with_all_filters(self, mock_get_questions):
        """Test get_filtered_questions forwards all filter values."""
        mock_get_questions.return_value = [{"questionID": "q1"}]

        result = QuestionService.get_filtered_questions(
            num_questions=5,
            resource_type=settings.QUESTION_RESOURCE_WATER,
            question_type=settings.QUESTION_MCQ,
            difficulty=3
        )

        self.assertEqual(len(result), 1)
        mock_get_questions.assert_called_once_with(
            num_questions=5,
            resource_type=settings.QUESTION_RESOURCE_WATER,
            question_type=settings.QUESTION_MCQ,
            difficulty=3
        )

    @patch("services.question_service.get_questions")
    def test_get_filtered_questions_without_filters(self, mock_get_questions):
        """Test get_filtered_questions passes None for omitted filters."""
        mock_get_questions.return_value = []

        result = QuestionService.get_filtered_questions()

        self.assertEqual(result, [])
        mock_get_questions.assert_called_once_with(
            num_questions=None,
            resource_type=None,
            question_type=None,
            difficulty=None
        )


if __name__ == "__main__":
    unittest.main()
