"""Helper utilities for API unit tests."""
from fastapi import FastAPI, Depends
from starlette.middleware.sessions import SessionMiddleware
from typing import Dict, Optional


def create_test_app(user_data: Optional[Dict] = None) -> FastAPI:
    """
    Create a FastAPI app with SessionMiddleware and authentication mocks configured for testing.
    
    Args:
        user_data: Optional mock user data to override authentication with.
                   If provided, all authentication dependencies will return this data.
    
    Returns:
        FastAPI app ready for testing with session support and optional auth overrides
    """
    app = FastAPI()
    app.add_middleware(
        SessionMiddleware,
        secret_key="test-secret-key",
        max_age=2592000
    )
    
    # If user data is provided, override authentication dependencies
    if user_data:
        from api.dependencies import get_current_user, student_required
        
        # Create mock functions that return the provided user data
        async def mock_get_current_user(request=None):
            return user_data
        
        async def mock_student_required(request=None, person=None):
            return user_data
        
        app.dependency_overrides[get_current_user] = mock_get_current_user
        app.dependency_overrides[student_required] = mock_student_required
    
    return app