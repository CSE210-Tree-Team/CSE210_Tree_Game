"""User-related Pydantic schemas."""
from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING
from pydantic import BaseModel, EmailStr

if TYPE_CHECKING:
    from schemas.tree import TreeInfo


class UserInfo(BaseModel):
    """User information."""
    username: str
    email: EmailStr
    displayName: str
    roles: List[str]


class UserWithTree(BaseModel):
    """Combined user and tree information for /api/get-user-info."""
    success: bool
    user: UserInfo
    tree: Optional[TreeInfo] = None


class AccountProfile(BaseModel):
    """Account profile information that can be edited by users."""
    name: str
    email: EmailStr
    parentEmail: Optional[str] = None
    educationLevel: Optional[str] = None


class AccountProfileResponse(BaseModel):
    """Response for account profile endpoints."""
    success: bool
    profile: Optional[AccountProfile] = None
    message: Optional[str] = None
