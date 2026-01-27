from dataclasses import dataclass
from typing import Optional, Literal

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
