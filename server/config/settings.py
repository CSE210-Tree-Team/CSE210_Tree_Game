"""Application configuration and settings."""
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()


def _parse_bool(value: str, default: bool = False) -> bool:
    """Parse boolean-like environment values safely."""
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_optional_int(value: str) -> Optional[int]:
    """Parse optional integer environment values; empty means None."""
    if value is None or value.strip() == "":
        return None
    return int(value)


class Settings:
    """Application settings loaded from environment variables."""
    
    # ========== SERVER CONFIGURATION ==========
    HOST: str = "localhost"
    PORT: int = 8000
    
    # ========== SECURITY & AUTHENTICATION ==========
    MIDDLEWARE_SECRET_KEY: str = os.getenv("MIDDLEWARE_SECRET_KEY", "")
    CLEAR_SESSIONS_ON_RESTART: bool = _parse_bool(
        os.getenv("CLEAR_SESSIONS_ON_RESTART", "true"),
        default=True
    )
    # None means browser-session cookie (cleared when browser closes).
    SESSION_MAX_AGE: Optional[int] = _parse_optional_int(os.getenv("SESSION_MAX_AGE", ""))
    
    # Account roles - must match CHECK constraint in database
    ROLE_STUDENT: str = "Student"
    ROLE_TEACHER: str = "Teacher"
    VALID_ROLES: List[str] = [ROLE_STUDENT, ROLE_TEACHER]
    
    # ========== EMAIL CONFIGURATION ==========
    EMAIL_SENDER: str = "potplugtesting@gmail.com"
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    
    # Carrier Configuration for SMS/MMS
    CARRIERS: Dict[str, str] = {
        "att": "@mms.att.net",
        "tmobile": "@tmomail.net",
        "verizon": "@vtext.com",
        "sprint": "@messaging.sprintpcs.com"
    }
    
    # ========== FRONTEND CONFIGURATION ==========
    FRONTEND_PATH: str = os.path.join("..", "client", "dist")
    
    # ========== DATABASE CONFIGURATION ==========
    DB_NAME: str = "game_database.db"
    
    # ========== TREE HEALTH STATUSES ==========
    # Based on resource thresholds - automatically calculated from water/earth levels
    HEALTH_HEALTHY: str = "Healthy"          # >= TREE_HEALTH_THRESHOLD
    HEALTH_UNHEALTHY: str = "Unhealthy"      # >= TREE_UNHEALTHY_THRESHOLD and < TREE_HEALTH_THRESHOLD
    HEALTH_WITHERED: str = "Withered"        # < TREE_UNHEALTHY_THRESHOLD
    VALID_HEALTH_STATUSES: List[str] = [HEALTH_HEALTHY, HEALTH_UNHEALTHY, HEALTH_WITHERED]
    
    # Tree Health Thresholds (based on water level)
    # >= 70: Healthy tree
    # >= 40: Typical/Unhealthy tree
    # < 40: Withered/Dry tree
    TREE_HEALTH_THRESHOLD: int = 70
    TREE_UNHEALTHY_THRESHOLD: int = 40
    
    # Earth Health Thresholds (based on earth level)
    # >= 75: Healthy earth
    # >= 45: Typical/Unhealthy earth
    # < 45: Withered/Dry earth
    EARTH_HEALTH_THRESHOLD: int = 75
    EARTH_UNHEALTHY_THRESHOLD: int = 45
    
    # ========== EVENT TYPES ==========
    # Must match CHECK constraint in database
    EVENT_BONUS: str = "Bonus"
    EVENT_PENALTY: str = "Penalty"
    EVENT_LEVEL: str = "Level"
    EVENT_NEUTRAL: str = "Neutral"
    EVENT_CHANGE: str = "Change"  # For falling under threshold
    VALID_EVENT_TYPES: List[str] = [EVENT_LEVEL, EVENT_BONUS, EVENT_PENALTY, EVENT_NEUTRAL, EVENT_CHANGE]
    
    # ========== RESOURCES ==========
    # Lowercase resource identifiers
    RESOURCE_WATER: str = "water"
    RESOURCE_EARTH: str = "earth"
    RESOURCE_SUN: str = "sun"
    RESOURCE_NONE: str = "none"
    RESOURCE_ALL: str = "all"
    VALID_RESOURCES: List[str] = [RESOURCE_WATER, RESOURCE_EARTH, RESOURCE_SUN, RESOURCE_NONE, RESOURCE_ALL]
    
    # Resource level bounds
    RESOURCE_MAX_LEVEL: int = 100
    RESOURCE_MIN_LEVEL: int = 0
    
    # ========== QUESTION TYPES ==========
    # Must match CHECK constraint in database
    QUESTION_MCQ: str = "MCQ"
    QUESTION_FREE_RESPONSE: str = "FreeResponse"
    QUESTION_MULTI_SELECT: str = "MultiSelect"
    VALID_QUESTION_TYPES: List[str] = [QUESTION_MCQ, QUESTION_FREE_RESPONSE, QUESTION_MULTI_SELECT]
    
    # ========== QUESTION RESOURCE TYPES ==========
    QUESTION_RESOURCE_WATER: str = "water"
    QUESTION_RESOURCE_EARTH: str = "earth"
    QUESTION_RESOURCE_SUN: str = "sun"
    QUESTION_RESOURCE_GENERAL: str = "general"  # For all of them.
    QUESTION_RESOURCE_NONE: str = "none"  # For questions that don't affect resources.
    VALID_QUESTION_RESOURCE_TYPES: List[str] = [
        QUESTION_RESOURCE_WATER,
        QUESTION_RESOURCE_EARTH,
        QUESTION_RESOURCE_SUN,
        QUESTION_RESOURCE_GENERAL,
        QUESTION_RESOURCE_NONE
    ]

    # ========== TIMING & DECAY ==========
    # Passive decay rates for resources -- how many minutes to decay 1 level of the resource
    PASSIVE_DECAY_RATE: int = 30  # 30 minutes to decay 1 level - 50 hours for tree to die from full.
    
    def validate(self) -> None:
        """Validate required settings are present."""
        if not self.CLEAR_SESSIONS_ON_RESTART and not self.MIDDLEWARE_SECRET_KEY:
            raise ValueError("MIDDLEWARE_SECRET_KEY must be set in environment")
    

settings = Settings()
