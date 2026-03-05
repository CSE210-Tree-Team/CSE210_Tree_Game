"""Tree-related Pydantic schemas."""
from __future__ import annotations
from typing import Dict, Optional
from pydantic import BaseModel, Field


class TreeInfo(BaseModel):
    """Tree information with health, growth stage, and resource levels."""
    treeID: Optional[str] = None
    health: Optional[str] = None
    growthStage: Optional[int] = None
    resourceLevels: Optional[Dict[str, int]] = None


class StatUpdateRequest(BaseModel):
    """Request to update a tree resource stat (water/earth/sun)."""
    stat_name: str = Field(..., description="water, earth, or sun (case-insensitive)")
    value: int = Field(..., description="Amount to add/subtract")


class StatUpdateResponse(BaseModel):
    """Response after updating a stat."""
    success: bool
    message: str
