"""Event-related data schemas."""
from dataclasses import dataclass
from typing import Literal, Optional

EventType = Literal["Decay", "Bonus", "Penalty", "Change"]
Resource = Literal["Water", "Earth", "Sun", "None", "All"]


@dataclass
class Event:
    eventID: str
    eventType: EventType
    resourceAffected: Resource
    description: Optional[str]
    percentChange: int
    conditions: Optional[str]
