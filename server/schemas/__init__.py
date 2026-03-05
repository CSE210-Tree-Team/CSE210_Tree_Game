"""Pydantic schemas for request/response validation."""
from typing import Any, Optional, List
from pydantic import BaseModel
from schemas.tree import TreeInfo, StatUpdateRequest, StatUpdateResponse
from schemas.user import UserInfo, UserUpdate, UserWithTree
from schemas.question import (
    QuestionChoice,
    QuestionCreate,
    QuestionResponse,
    QuestionsGetRequest
)
from schemas.event import Event, EventType, Resource, DUMMY_EVENT

# Rebuild models to resolve forward references
UserWithTree.model_rebuild()


# Generic response schemas
class GenericResponse(BaseModel):
    """Generic response with success status and message."""
    success: bool
    message: str


class DataResponse(BaseModel):
    """Generic response with success status and data payload."""
    success: bool
    data: Any = None


class QuestionListResponse(BaseModel):
    """Response containing a list of questions."""
    success: bool
    count: int
    questions: List[QuestionResponse]


__all__ = [
    "TreeInfo",
    "StatUpdateRequest",
    "StatUpdateResponse",
    "UserInfo",
    "UserUpdate",
    "UserWithTree",
    "QuestionChoice",
    "QuestionCreate",
    "QuestionResponse",
    "QuestionsGetRequest",
    "Event",
    "EventType",
    "Resource",
    "DUMMY_EVENT",
    "GenericResponse",
    "DataResponse",
    "QuestionListResponse",
]
