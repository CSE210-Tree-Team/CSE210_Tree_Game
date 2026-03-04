"""Helper utilities for API unit tests."""
from fastapi import FastAPI, Depends
from starlette.middleware.sessions import SessionMiddleware


def create_test_app() -> FastAPI:
    """
    Create a FastAPI app with SessionMiddleware configured for testing.
    
    Returns:
        FastAPI app ready for testing with session support
    """
    app = FastAPI()
    app.add_middleware(
        SessionMiddleware,
        secret_key="test-secret-key",
        max_age=2592000
    )
    return app


def override_student_required(student_data):
    """
    Create a function to override the student_required dependency.
    
    Args:
        student_data: Dictionary containing mock student data
        
    Returns:
        A function that can be used to override the dependency
    """
    def _override():
        return student_data
    return _override
