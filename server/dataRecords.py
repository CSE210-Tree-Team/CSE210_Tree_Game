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

@dataclass
class Tree:
    treeID: str
    ownerUsername: str
    resourceLevels: dict[str, int]  # {'water': int, 'earth': int, 'sun': int}
    lastUpdated: str  # ISO formatted date string