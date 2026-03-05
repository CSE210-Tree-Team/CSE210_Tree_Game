"""Custom exceptions for the application."""
from fastapi import Request
from fastapi.responses import RedirectResponse


class NeedLoginException(Exception):
    """
    Exception raised when user needs to login.
    
    This exception is raised when a protected endpoint is accessed without
    valid authentication. The exception handler automatically redirects
    the user to the login page with an autoLogin parameter.
    The exception handler will redirect to: /?autoLogin=true for page loads,
    or return a 401 JSON response for API calls.
    """
    pass


async def redirect_to_login_handler(request: Request, exc: NeedLoginException):
    """
    Exception handler that redirects to login page or returns 401 for API calls.
    
    This handler is registered in the main application and automatically
    catches NeedLoginException instances. For API requests, it returns a 401
    status code. For browser page requests, it redirects to the login page.
    
    Args:
        request: The FastAPI request object
        exc: The NeedLoginException that was raised
        
    Returns:
        JSONResponse with 401 status for API calls, or
        RedirectResponse to the login page with autoLogin=true parameter for page loads
    """
    from fastapi.responses import JSONResponse
    
    # Check if this is an API request (starts with /api/)
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"}
        )
    
    # For non-API requests (page loads), redirect to login
    return RedirectResponse(url="/?autoLogin=true")
