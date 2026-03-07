"""User-related Pydantic schemas."""
from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from pydantic import BaseModel, EmailStr

if TYPE_CHECKING:
    from schemas.tree import TreeInfo


class UserInfo(BaseModel):
    """User information - unified user and profile data."""
    username: str
    email: EmailStr
    displayName: str
    roles: List[str]
    contactEmail: Optional[str] = None
    educationLevel: Optional[int] = None


class UserUpdate(BaseModel):
    """Partial user profile update payload for /api/update-user."""
    email: Optional[EmailStr] = None
    displayName: Optional[str] = None
    contactEmail: Optional[str] = None
    educationLevel: Optional[int] = None


class UserWithTree(BaseModel):
    """Combined user and tree information for /api/get-user-info."""
    success: bool
    message: Optional[str] = None
    user: UserInfo
    tree: Optional[TreeInfo] = None
