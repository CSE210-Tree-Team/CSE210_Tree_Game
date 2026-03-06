"""
Main application entry point for the Tree Game API.
"""

import os
import secrets
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

# Configuration
from config import settings

# Utilities
from utils.exceptions import NeedLoginException, redirect_to_login_handler
from api.dependencies import student_required

# Services
from services.decay_service import DecayService

# API Routers
from api.routers import auth, users, stats, questions


############################################
#               App Setup                  #
############################################

app = FastAPI(
    title="Tree Game API",
    description="Educational tree-growing game with passive decay mechanics",
    version="2.0.0"
)

# Middleware
session_secret = settings.MIDDLEWARE_SECRET_KEY
if settings.CLEAR_SESSIONS_ON_RESTART:
    session_secret = secrets.token_urlsafe(32)

app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret,
    max_age=settings.SESSION_MAX_AGE
)

# Exception handlers
app.add_exception_handler(NeedLoginException, redirect_to_login_handler)

# Initialize services
decay_service = DecayService(decay_rate_minutes=settings.PASSIVE_DECAY_RATE)

############################################
#             Lifecycle Events             #
############################################

@app.on_event("startup")
async def startup_event():
    """
    Initialize services when the app starts.
    
    This lifecycle hook is called once when the FastAPI application starts.
    It performs the following tasks:
    1. Validates required configuration settings
    2. Starts the passive decay background service
    3. Logs successful startup
    
    Raises:
        Exception: If configuration validation fails or services can't start
    """
    try:
        settings.validate()
        decay_service.start()
        print("Application started successfully")
    except Exception as e:
        print(f"Error during startup: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """
    Clean up services when the app shuts down.
    """
    decay_service.stop()
    print("Application shutdown complete")


############################################
#               Routers                    #
############################################

# Include all API routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(stats.router)
app.include_router(questions.router)


############################################
#             Static Routes                #
############################################

@app.get("/")
def serve_frontend():
    """
    Serve the frontend application.
    
    This is the main entry point that serves the React frontend's index.html.
    All frontend routing is handled client-side by React Router.
    
    Returns:
        FileResponse: The index.html file from the built frontend
        or dict: Error message if frontend not built
        
    Example usage:
    ```
    # User navigates to http://localhost:8000/
    # -> Serves client/dist/index.html
    # -> React app takes over routing
    ```
    
    Note: Make sure to build the frontend first with 'npm run build' in the client directory.
    """
    index_path = os.path.join(settings.FRONTEND_PATH, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not built. Run 'npm run build' in the client directory."}


@app.get("/{full_path:path}")
def serve_frontend_assets_and_routes(full_path: str):
    """
    Serve built frontend static files and SPA routes.

    - Requests for existing files in client/dist (e.g., fonts, images, JS, CSS) return that file.
    - Non-file frontend routes fall back to index.html for React Router.
    - /api/* is excluded so unknown API paths still return API-style 404s.
    """
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")

    frontend_root = os.path.abspath(settings.FRONTEND_PATH)
    if not os.path.isdir(frontend_root):
        return {"message": "Frontend not built. Run 'npm run build' in the client directory."}

    safe_path = os.path.normpath(full_path).lstrip(os.sep)
    requested_path = os.path.abspath(os.path.join(frontend_root, safe_path))

    # Block path traversal outside the frontend dist directory.
    if os.path.commonpath([frontend_root, requested_path]) != frontend_root:
        raise HTTPException(status_code=404, detail="Not Found")

    if os.path.isfile(requested_path):
        return FileResponse(requested_path)

    index_path = os.path.join(frontend_root, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    return {"message": "Frontend not built. Run 'npm run build' in the client directory."}

############################################
#                  Server                  #
############################################

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT
    )
