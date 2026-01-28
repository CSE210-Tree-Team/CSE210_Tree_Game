import os
import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from Database.getItemsFromDatabase import get_person, get_tree
from Database.addItemsToDatabase import new_account
from constants import ROLE_STUDENT

load_dotenv()

app = FastAPI()

# --- Auth0 Config ---
AUTH0_DOMAIN = os.getenv("VITE_AUTH0_DOMAIN")
AUTH0_CLIENT_ID = os.getenv("VITE_AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")
MIDDLEWARE_SECRET_KEY = os.getenv("MIDDLEWARE_SECRET_KEY")

app.add_middleware(SessionMiddleware, secret_key=MIDDLEWARE_SECRET_KEY)

oauth = OAuth()
oauth.register(
    "auth0",
    client_id=AUTH0_CLIENT_ID,
    client_secret=AUTH0_CLIENT_SECRET,
    server_metadata_url=f"https://{AUTH0_DOMAIN}/.well-known/openid-configuration",
    client_kwargs={"scope": "openid profile email"},
)

# --- Static File Serving ---
if os.path.exists("Home Page/dist"):
    app.mount("/assets", StaticFiles(directory="Home Page/dist/assets"), name="static")




############################################
#               Helper Functions           #
############################################

class NeedLoginException(Exception):
    # Gemini helped me with figuring out how to handle cases where login is needed.
    pass

@app.exception_handler(NeedLoginException)
async def redirect_to_login(request: Request, exc: NeedLoginException):
    return RedirectResponse(url="/?autoLogin=true")
    
def is_student(user_ref: str) -> bool:
    """Check if the user with the given accountReference is a Student."""
    person = get_person(user_ref)
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

def get_user_ref(request: Request):
    """Extracts the accountReference from the session user. This is used in the getItemsFromDatabase functions."""
    return request.session.get("user")
    
def get_user_ID(request: Request):
    """Extracts the accountID from the database based on the session user."""
    user_ref = request.session.get("user")
    if not user_ref:
        return None
    person = get_person(user_ref)
    return person.get('accountID') if person else None

def get_tree_ID(request: Request):
    """Retrieves the treeID for the currently logged-in user."""
    user_ref = request.session.get("user")
    tree_object = get_tree(user_ref)
    
    return tree_object['treeID'] if tree_object else None



##########################################
#             Dependencies               #
##########################################

# Checks if User is Authenticated
async def get_current_user(request: Request):
    """
    Checks your session/cookie/token for the user reference.
    """
    user_ref = request.session.get("user")
    
    if not user_ref:
        raise NeedLoginException()

    person = get_person(user_ref)
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
    index_path = os.path.join("Home Page", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

@app.get("/api/auth/callback")
async def auth_callback(request: Request):
    """Handle Auth0 callback and store user info in session."""
    token = await oauth.auth0.authorize_access_token(request)
    user_info = token.get('userinfo')
    
    if user_info:
        # Store user reference (email or sub) in session
        request.session["user"] = user_info.get("email") or user_info.get("sub")
        request.session["user_info"] = dict(user_info)
    
    return RedirectResponse(url="/")

@app.post("/api/auth/verify")
async def verify_auth(request: Request):
    """Verify Auth0 token and establish backend session."""
    try:
        data = await request.json()
        user_data = data.get('user', {})
        
        if user_data:
            # Get user reference (email or sub)
            user_ref = user_data.get("email") or user_data.get("sub")
            
            # Check if user exists in database
            person = get_person(user_ref)
            
            if not person:
                # Create new student account
                try:
                    new_account(
                        username=user_data.get("nickname", user_data.get("email", "user")),
                        email=user_data.get("email", ""),
                        passwordHash="auth0",  # Not used for Auth0 users
                        displayName=user_data.get("name", user_data.get("nickname", "Student")),
                        accountReference=user_ref,
                        dateOfBirth="2000-01-01",  # Default date
                        role=ROLE_STUDENT
                    )
                except Exception as e:
                    print(f"Error creating account: {e}")
                    raise HTTPException(status_code=500, detail="Failed to create account")
            
            # Store user reference in session
            request.session["user"] = user_ref
            request.session["user_info"] = user_data
            
            return {"success": True, "message": "Session established"}
        
        return {"success": False, "message": "No user data provided"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/auth/login")
async def login(request: Request):
    """Initiate Auth0 login."""
    redirect_uri = request.url_for('auth_callback')
    return await oauth.auth0.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/logout")
async def logout(request: Request):
    """Clear session and logout."""
    request.session.clear()
    return RedirectResponse(url="/")

@app.get("/api/auth/session")
async def get_session(request: Request):
    """Check if user is authenticated and return session info."""
    user_ref = request.session.get("user")
    if user_ref:
        return {
            "authenticated": True,
            "user": request.session.get("user_info", {})
        }
    return {"authenticated": False}

@app.get("/manageAccount")
def manage_account(account=Depends(get_current_user)):
    return {"message": f"Manage account page for {account['displayName']}"}

@app.get("/soilGame")
def soil_game(student=Depends(student_required)):
    return {"message": f"Soil Game page for {student['displayName']}"}

@app.get("/rainGame")
def tree_game(student=Depends(student_required)):
    return {"message": f"Tree Game page for {student['displayName']}"}



############################################
#               API Endpoints              #
#############################################

@app.get("/api/get-user-info")
def get_user_info(request: Request, student=Depends(student_required)):
    """
    Returns the IDs to the frontend, as well as tree stats.

    Returns:
        dict: {
            "accountID": str,
            "userRef": str,
            "treeID": str,
            "resourceLevels": dict {'water': x, 'earth': x, 'sun': x},
            "displayName": str
        }
    """
    user_ID = get_user_ID(request) if student else None
    user_ref = get_user_ref(request) if student else None
    tree = get_tree(user_ref) if student else None
    tree_ID = tree['treeID'] if tree else None
    resource_levels = tree['resourceLevels'] if tree else None

    return {
        "accountID": user_ID,
        "userRef": user_ref,
        "treeID": tree_ID,
        "resourceLevels": resource_levels,
        "displayName": student.get("displayName")
    }

@app.post("/api/update-stat/{stat_name}")
def update_stat(stat_name: str, value: int, request: Request, student=Depends(student_required)):
    """
    Updates a specific stat for the student's tree. Treats this update as an event.
    stat_name: Name of the stat to update (e.g., "water", "earth", "sun").
    value: New value for the stat.
    """
    # TODO: Implement stat update logic here.
    return None

@app.post("/api/add-question")
def api_add_question(request: Request, student=Depends(student_required)):
    """
    API endpoint to add a question to the database.
    """
    # TODO: Implement question addition logic here.
    return None



############################################
#                  Server                  #
############################################

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=5173)