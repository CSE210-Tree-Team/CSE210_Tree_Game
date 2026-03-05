"""Question-related Pydantic schemas."""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel


class QuestionChoice(BaseModel):
    text: str
    isCorrect: bool


class QuestionCreate(BaseModel):
    text: str
    question_type: str
    resource_type: str
    choices: List[str] = []
    correct_choices: List[int] = []
    check_duplicates: bool = True


class QuestionResponse(BaseModel):
    """Question with full details including choices."""
    questionID: str
    text: str
    type: str
    difficulty: Optional[int]
    resourceType: str
    choices: List[QuestionChoice]


class QuestionsGetRequest(BaseModel):
    """Filter parameters for retrieving questions."""
    numQuestions: Optional[int] = None
    resourceType: Optional[str] = None
    questionType: Optional[str] = None
    difficulty: Optional[int] = None
