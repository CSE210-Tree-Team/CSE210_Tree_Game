import os
import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from Database.getItemsFromDatabase import get_person, get_tree
from Database.addItemsToDatabase import add_account, generate_tree
from constants import ROLE_STUDENT
from dataRecords import Tree, Event


############################################
#               App Setup                  #
############################################

load_dotenv()
app = FastAPI()
MIDDLEWARE_SECRET_KEY = os.getenv("MIDDLEWARE_SECRET_KEY")
app.add_middleware(SessionMiddleware, secret_key=MIDDLEWARE_SECRET_KEY)

# --- Static File Serving ---
if os.path.exists("Home Page/dist"):
    app.mount("/assets", StaticFiles(directory="Home Page/dist/assets"), name="static")

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
    index_path = os.path.join("Home Page", "dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

@app.get("/manageAccount")
def manage_account(account=Depends(get_current_user)):
    return {"message": f"Manage account page for {account['displayName']}"}

@app.get("/soilGame")
def soil_game(student=Depends(student_required)):
    return {"message": f"Soil Game page for {student['displayName']}"}

@app.get("/rainGame")
def tree_game(student=Depends(student_required)):
    return {"message": f"Rain Game page for {student['displayName']}"}



############################################
#               API Endpoints              #
#############################################

@app.post("/api/auth/verify")
async def verify_auth(request: Request):
    """Verify Auth0 token and establish backend session."""
    try:
        data = await request.json()
        user_data = data.get('user', {})

        print(f"Auth0 user data received: {user_data}")
        
        if user_data:
            # Get username (email or sub) # NOTE: sub is the unique Auth0 user ID
            username = user_data.get("email") or user_data.get("sub")
            
            # Check if user exists in database
            person = get_person(username)
            
            if not person:
                create_account(username = username, user_data = user_data)
            
            # Store username in session
            request.session["user"] = username
            request.session["user_info"] = user_data
            
            return {"success": True, "message": "Session established"}
        
        return {"success": False, "message": "No user data provided"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
    uvicorn.run(app, host="localhost", port=5173)