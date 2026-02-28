"""Question management service."""
from typing import Optional, List, Dict
from database.getItemsFromDatabase import get_question, get_questions
from database.addItemsToDatabase import add_question


class QuestionService:
    """
    Handles question-related business logic.
    
    This service manages all operations related to educational questions,
    including creating, retrieving, and filtering questions from the database.
    
    Example usage:
    ```python
    # Add a new question
    question_id = QuestionService.add_new_question(
        text='What is photosynthesis?',
        question_type='MCQ',
        resource_type='Sun',
        choices=['Making food', 'Breathing', 'Growing'],
        correct_choices=[0]
    )
    """
    
    @staticmethod
    def add_new_question(
        text: str,
        question_type: str,
        resource_type: str,
        choices: List[str],
        correct_choices: List[int],
        check_duplicates: bool = True
    ) -> str:
        """
        Add a new question to the database.
        
        This method validates and adds a new educational question. It supports
        multiple question types and can check for duplicates to prevent redundancy.
        Check settings.py for updated question types and resource types.
        
        Args:
            text: The question text
            question_type: Type of question
                - 'MCQ': Multiple Choice (single correct answer)
                - 'MultiSelect': Multiple correct answers possible
                - 'FreeResponse': Text-based answer
            resource_type: Associated resource type
                - 'water', 'earth', 'sun': Specific resource
                - 'general': Applies to all resources
                - 'none': No resource association
            choices: List of answer choices (empty for FreeResponse)
            correct_choices: List of indices of correct answers (0-based)
                - For MCQ: Single index, e.g., [0]
                - For MultiSelect: Multiple indices, e.g., [0, 2]
                - For FreeResponse: Empty list []
            check_duplicates: Whether to check for duplicate questions
            
        Returns:
            str: UUID of the created question
            
        Raises:
            ValueError: If validation fails (invalid type, empty text, etc.)
            
        Note: Question types and resource types must match constants in settings.py
        """
        return add_question(
            text=text,
            question_type=question_type,
            resource_type=resource_type,
            choices=choices,
            correct_choices=correct_choices,
            check_duplicates=check_duplicates
        )
    
    @staticmethod
    def get_question_by_id(question_id: str) -> Optional[Dict]:
        """
        Get a single question by ID.
        
        Args:
            question_id: UUID of the question
            
        Returns:
            Dict with question data or None if not found
            {
                'questionID': str,
                'text': str,
                'type': str,
                'resourceType': str,
                'choices': [str],
                'correct_choices': [int]  // Indices of correct answers
            }
        """
        return get_question(question_id)
    
    @staticmethod
    def get_filtered_questions(
        num_questions: Optional[int] = None,
        resource_type: Optional[str] = None,
        question_type: Optional[str] = None,
        difficulty: Optional[int] = None
    ) -> List[Dict]:
        """
        Get questions with optional filtering.
        
        This method retrieves questions from the database with flexible filtering
        options. Useful for creating customized quizzes or practice sessions.
        
        Args:
            num_questions: Maximum number of questions to return (None = all)
            resource_type: Filter by resource ('water', 'earth', 'sun', etc.)
            question_type: Filter by type ('MCQ', 'MultiSelect', 'FreeResponse')
            difficulty: Filter by difficulty level (integer)
            
        Returns:
            List of question dictionaries
            [
                {
                    'questionID': str,
                    'text': str,
                    'type': str,
                    'difficulty': int,
                    'resourceType': str,  # lowercase: 'water', 'earth', 'sun', etc.
                    'choices': [{text: str, isCorrect: bool}, ...]
                },
                ...
            ]
        
        Note: Filters can be combined. If a parameter is None, that filter is not applied.
        """
        return get_questions(
            num_questions=num_questions,
            resource_type=resource_type,
            question_type=question_type,
            difficulty=difficulty
        )
