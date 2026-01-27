import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, status
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import dataRecords
import os

from Database.getItemsFromDatabase import get_person, get_tree

# TODO: We should consistently be updating the 
# last login time to ensure accuracy while student is doing stuff.

##########################################
#            Global Variables            #
##########################################

load_dotenv()
app = FastAPI()
AUTH0_DOMAIN = os.getenv("VITE_AUTH0_DOMAIN")
AUTH0_CLIENT_ID = os.getenv("VITE_AUTH0_CLIENT_ID")
MIDDLEWARE_SECRET_KEY = "change" # os.getenv("MIDDLEWARE_SECRET_KEY") TODO: Change this to a secure random key.

app.add_middleware(
    SessionMiddleware,
    secret_key=MIDDLEWARE_SECRET_KEY
)

# TODO: Yan -- Set up oauth with Auth0.
# oauth = OAuth()
# oauth.register(
#     "auth0",
#     client_id=AUTH0_CLIENT_ID,
#     client_secret=os.getenv("AUTH0_CLIENT_SECRET"), # You'll need this in your .env
#     server_metadata_url=  ,
#     client_kwargs=   ,
# )



############################################
#               Helper Functions           #
############################################

class NeedLoginException(Exception):
    # Gemini helped me with figuring out how to handle cases where login is needed.
    pass

@app.exception_handler(NeedLoginException)
async def redirect_to_login(request: Request, exc: NeedLoginException):
    return RedirectResponse(url="/login")
    
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
async def student_required(request: Request, user_ref: str = Depends(get_current_user)):
    """
    Checks if the authenticated user is a student.
    """
    if user_ref is None:
        return RedirectResponse(url="/login")

    person = get_person(user_ref)
    
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
    return {"message": "Welcome to the Tree Game API! This will be the intro page."}

@app.get("/home")
def home(student=Depends(student_required)):

    # Requires student to be logged in.
    return {"message": f"Welcome, {student['displayName']}"}

@app.get("/login")
def login():
    # TODO: Yan - Implement Auth0 login flow here.
    return {"message": "This will be the login page. Implement Auth0 login here."}

@app.get("/callback")
async def auth_callback(request: Request):
    # TODO: Yan - Implement Auth0 callback handling here.
    return {"message": "This will handle the Auth0 callback."}

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    # TODO: Yan - Redirect to Auth0 logout URL if needed.
    return RedirectResponse(url="/")

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
    uvicorn.run(app, host="127.0.0.1", port=8000)