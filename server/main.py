import os
import uvicorn
import logging
import threading
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from jose import jwt, JWTError
import httpx
from functools import lru_cache
from time import time
from Database.getItemsFromDatabase import get_person, get_tree
from Database.addItemsToDatabase import add_account, generate_tree
from constants import ROLE_STUDENT
from dataRecords import Tree, Event


############################################
#               App Setup                  #
############################################

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
app = FastAPI()
MIDDLEWARE_SECRET_KEY = os.getenv("MIDDLEWARE_SECRET_KEY")
app.add_middleware(SessionMiddleware, secret_key=MIDDLEWARE_SECRET_KEY)

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_ALGORITHMS = ["RS256"]

# Validate Auth0 configuration at startup
if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
    logger.warning(
        "AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables are not set. "
        "Authentication will fail until these are configured."
    )

# JWKS cache with 1 hour TTL
_jwks_cache = None
_jwks_cache_time = 0
_jwks_cache_lock = threading.Lock()
JWKS_CACHE_TTL = 3600  # 1 hour in seconds

# --- Static File Serving ---
frontend_path = os.path.join("..", "client", "dist")
if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="static")
# TODO: Need to fix log out process so that session is properly cleared.


############################################
#               Helper Functions           #
############################################

class NeedLoginException(Exception):
    # Gemini helped me with figuring out how to handle cases where login is needed.
    pass

@app.exception_handler(NeedLoginException)
async def redirect_to_login(request: Request, exc: NeedLoginException):
    return RedirectResponse(url="/?autoLogin=true")

async def get_jwks() -> dict:
    """
    Fetch JWKS from Auth0 with thread-safe caching.
    Cache is valid for 1 hour to avoid unnecessary network calls.
    """
    global _jwks_cache, _jwks_cache_time
    
    current_time = time()
    
    # Check cache without lock first for performance
    if _jwks_cache and (current_time - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache
    
    # Acquire lock to update cache
    with _jwks_cache_lock:
        # Double-check after acquiring lock
        if _jwks_cache and (current_time - _jwks_cache_time) < JWKS_CACHE_TTL:
            return _jwks_cache
        
        # Fetch new JWKS
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            jwks_response = await client.get(jwks_url)
            jwks_response.raise_for_status()
            jwks = jwks_response.json()
        
        # Update cache
        _jwks_cache = jwks
        _jwks_cache_time = current_time
        
        return jwks

async def verify_jwt_token(token: str) -> dict:
    """
    Verify Auth0 JWT token and return decoded claims.
    
    Args:
        token: The JWT access token from Authorization header
        
    Returns:
        dict: Decoded JWT claims containing user information
        
    Raises:
        HTTPException: If token validation fails
    """
    if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
        raise HTTPException(
            status_code=500,
            detail="Authentication service configuration error"
        )
    
    try:
        # Get JWKS (JSON Web Key Set) from Auth0 with caching
        jwks = await get_jwks()
        
        # Decode and validate the token
        # This will verify signature, expiration, audience, and issuer
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=401,
                detail="Unable to find appropriate key"
            )
        
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=AUTH0_ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        
        return payload
        
    except JWTError as e:
        logger.warning(f"JWT validation failed: {type(e).__name__} - {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch JWKS from Auth0: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Authentication service unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail="Authentication failed"
        )
    
def is_student(username: str) -> bool:
    """Check if the user with the given username is a Student."""
    person = get_person(username)
    if person and 'Student' in person.get('roles', []):
        return True
    return False

def apply_event(treeID, eventID):
    # TODO: Implement event application logic here. Events will be used to modify tree stats.
    return False

def recompute_tree_health(treeID):
    # TODO: Implement tree health recomputation logic here.
    # Will update apperance, health status, bars, etc.
    return False
    
def get_username(request: Request):
    """Extracts the username from the session."""
    return request.session.get("user")

def get_tree_ID(request: Request):
    """Retrieves the treeID for the currently logged-in user."""
    username = request.session.get("user")
    tree_object = get_tree(username)
    
    return tree_object['treeID'] if tree_object else None

def create_account(username: str, user_data: dict):
    # Create new student account
    try:
        output_username = add_account(
            username=username,
            email=user_data.get("email", ""),
            passwordHash="auth0",  # Not used for Auth0 users
            displayName=user_data.get("name", user_data.get("nickname", "Student")),
            accountReference=user_data.get("nickname", user_data.get("email", "user")),
            dateOfBirth="2000-01-01",  # Default date  # TODO: Get DOB from user later
            role=ROLE_STUDENT
        )

        output_tree_id = generate_tree(username)

        print(f"Created new account for {username} with tree ID {output_tree_id}")

        
    except Exception as e:
        print(f"Error creating account: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account")


##########################################
#             Dependencies               #
##########################################

# Checks if User is Authenticated
async def get_current_user(request: Request):
    """
    Checks your session/cookie/token for the username.
    """
    username = request.session.get("user")
    
    if not username:
        raise NeedLoginException()

    person = get_person(username)
    if not person or 'Student' not in person.get('roles', []):
        raise HTTPException(status_code=403, detail="Student role required")
        
    return person

# Checks if User is Student
async def student_required(request: Request, person = Depends(get_current_user)):
    """
    Checks if the authenticated user is a student.
    """
    if person is None:
        return RedirectResponse(url="/")
    
    if not person or 'Student' not in person.get('roles', []):
        # Logged in, but not student.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Student role required."
        )
        
    return person



############################################
#                   Routes                 #
############################################

@app.get("/")
def default_page():
    index_path = os.path.join("..", "client", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

@app.get("/manageAccount")
def manage_account(account=Depends(get_current_user)):
    return {"message": f"Manage account page for {account['displayName']}"}

# @app.get("/soilGame")
# def soil_game(student=Depends(student_required)):
#     return {"message": f"Soil Game page for {student['displayName']}"}

# @app.get("/rainGame")
# def tree_game(student=Depends(student_required)):
#     return {"message": f"Rain Game page for {student['displayName']}"}



############################################
#               API Endpoints              #
############################################

@app.post("/api/auth/verify")
async def verify_auth(request: Request):
    """Verify Auth0 token and establish backend session."""
    try:
        # Extract the Bearer token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Missing or invalid Authorization header"
            )
        
        # Extract token (after "Bearer ")
        token = auth_header[7:].strip()
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Empty token in Authorization header"
            )
        
        # Verify the JWT token and get claims
        payload = await verify_jwt_token(token)
        
        # Extract user information from verified token claims
        # Auth0 tokens contain 'sub' (subject) which is the unique user ID
        # They may also contain email and other claims
        username = payload.get("email") or payload.get("sub")
        
        if not username:
            raise HTTPException(
                status_code=401,
                detail="Unable to extract user identity from token"
            )
        
        logger.info(f"Verified user from JWT: {username}")
        
        # Check if user exists in database
        person = get_person(username)
        
        if not person:
            # Create account with verified user data from token
            user_data = {
                "sub": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "nickname": payload.get("nickname"),
                "picture": payload.get("picture")
            }
            create_account(username=username, user_data=user_data)
        
        # Store username in session
        request.session["user"] = username
        request.session["user_info"] = {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "nickname": payload.get("nickname"),
            "picture": payload.get("picture")
        }
        
        return {"success": True, "message": "Session established"}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log unexpected errors but don't expose internal details
        logger.error(f"Unexpected error in verify_auth: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/get-user-info")
def get_user_info(request: Request, student=Depends(student_required)):
    """
    Returns the IDs to the frontend, as well as tree stats.

    Returns:
        dict: {
            "username": str,
            "treeID": str,
            "resourceLevels": dict {'water': x, 'earth': x, 'sun': x},
            "displayName": str
        }
    """
    username = get_username(request) if student else None
    tree = get_tree(username) if student else None
    tree_ID = tree['treeID'] if tree else None
    resource_levels = tree['resourceLevels'] if tree else None

    return {
        "username": username,
        "treeID": tree_ID,
        "resourceLevels": resource_levels,
        "displayName": student.get("displayName")
    }

@app.post("/api/update-stat/{stat_name}")
def update_stat(stat_name: str, percent: int, request: Request, student=Depends(student_required)):
    """
    Updates a specific stat for the student's tree. Treats this update as an event.
    stat_name: Name of the stat to update (e.g., "water", "earth", "sun").
    percent: Percent increase to the stat.
    """
    # TODO: Implement stat update logic here.
    return None

@app.post("/api/update-user")
def update_user(displayName: str = None, dateOfBirth: str = None, request: Request = None):
    """
    API endpoint to update user information.
    """
    # TODO: Implement user update logic here.
    return None


@app.post("/api/add-question")
def api_add_question(request: Request, student=Depends(student_required)):
    """
    API endpoint to add a question to the database.
    """
    # TODO: Implement question addition logic here.
    return None

# Get question:
@app.get("/api/get-question/{question_id}")
def api_get_question(question_id: str, request: Request, student=Depends(student_required)):
    """
    API endpoint to retrieve a question from the database.
    """
    # TODO: Implement question retrieval logic here.
    return None

# Get questions:
@app.get("/api/get-questions")
def api_get_questions(numQuestions: int, resourceType: str, questionType: str, questionClass: str, request: Request, student=Depends(student_required)):
    """
    API endpoint to retrieve multiple questions from the database.
    """
    # TODO: Implement multiple question retrieval logic here.
    return None

############################################
#                  Server                  #
############################################

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)