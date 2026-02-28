"""Event-related data schemas."""
from dataclasses import dataclass
from typing import Literal, Optional

EventType = Literal["Decay", "Bonus", "Penalty"]
Resource = Literal["Water", "Earth", "Sun", "None", "All"]


@dataclass
class Event:
    eventID: str
    eventType: EventType
    resourceAffected: Resource
    description: Optional[str]
    percentChange: int
    conditions: Optional[str]


# Simple dummy event for testing/demo usage.
DUMMY_EVENT = Event(
    eventID="dummy-event-001",
    eventType="Bonus",
    resourceAffected="Water",
    description="Test event for local development.",
    percentChange=10,
    conditions="None"
)
