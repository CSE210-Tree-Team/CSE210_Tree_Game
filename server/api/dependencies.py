"""Dependency injection for authentication and authorization."""
from typing import Dict
from fastapi import Request, Depends, HTTPException, status
from utils.exceptions import NeedLoginException
from services.auth_service import AuthService


def get_username(request: Request) -> str:
    """
    Extract username from session.
    
    This dependency extracts the username from the session cookie.
    Used as a building block for other authentication dependencies.
    
    Args:
        request: FastAPI request object with session data
        
    Returns:
        str: Username from session
        
    Raises:
        NeedLoginException: If user is not logged in (no username in session)
    
    Note: NeedLoginException will be caught by the exception handler
    and redirect the user to the login page.
    """
    username = request.session.get("user")
    if not username:
        raise NeedLoginException()
    return username


async def get_current_user(request: Request) -> Dict:
    """
    Get the currently authenticated user.
    
    This dependency verifies that the user is logged in and has a valid
    account. It's the primary authentication check for protected endpoints.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Dict: User information dictionary
            {
                'username': str,
                'email': str,
                'displayName': str,
                'roles': [str],
                'dateOfBirth': str,
                'lastLogin': str
            }
        
    Raises:
        NeedLoginException: If not logged in
        HTTPException(403): If user not found
        
    Note: This checks authentication only. Role-based authorization is handled
    by dedicated dependencies such as student_required.
    """
    username = get_username(request)
    person = AuthService.get_user(username)
    
    if not person:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account not found"
        )
    
    return person


async def student_required(
    request: Request,
    person: Dict = Depends(get_current_user)
) -> Dict:
    """
    Dependency that ensures the user is a student. Just add `student=Depends(student_required)` 
    to any route.
    
    This is the standard dependency to use for all student-only endpoints.
    It builds on get_current_user to provide role-based authorization.
    
    Args:
        request: FastAPI request object
        person: User information from get_current_user dependency
        
    Returns:
        Dict: User information dictionary (same as get_current_user)
        
    Raises:
        HTTPException(403): If user is not a student
    
    
    Note: This depends on get_current_user and will call it first.
    """
    if not person or not AuthService.is_student(person['username']):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Student role required."
        )
    
    return person
