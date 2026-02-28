"""Authentication routes."""
from fastapi import APIRouter, Request, HTTPException
from schemas import GenericResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/verify", response_model=GenericResponse)
async def verify_auth(request: Request, body: dict):
    """
    Verify Auth0 token and establish backend session.
    
    This endpoint is called after successful Auth0 authentication to create
    a backend session and ensure the user exists in the database.
    
    Request body:
    {
        "user": {
            "email": "student@example.com",
            "sub": "auth0|123456789",
            "name": "John Doe",
            "nickname": "john"
        }
    }
    
    Returns:
    {
        "success": true,
        "message": "Session established"
    }
    
    Note: If the user doesn't exist, a new account and tree will be created automatically.
    """
    try:
        user_data = body.get("user")
        
        if not user_data:
            return GenericResponse(success=False, message="No user data provided")
        
        # Get username (email or sub - Auth0 unique ID)
        username = user_data.get("email") or user_data.get("sub")
        
        # Check if user exists
        person = AuthService.get_user(username)
        
        # Create account if doesn't exist
        if not person:
            AuthService.create_account(username=username, user_data=user_data)
        
        # Store username in session
        request.session["user"] = username
        request.session["user_info"] = user_data

        # Update login
        AuthService.update_login(username)
        
        return GenericResponse(success=True, message="Session established")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout", response_model=GenericResponse)
async def logout(request: Request):
    """Clear backend session data for the current user."""
    request.session.clear()
    return GenericResponse(success=True, message="Session cleared")
