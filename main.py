
import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, status
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import os

from Database.getItemsFromDatabase import get_person

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

# TODO: USet up oauth with Auth0.
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
    pass

@app.exception_handler(NeedLoginException)
async def redirect_to_login(request: Request, exc: NeedLoginException):
    return RedirectResponse(url="/login")
    
def is_student(user_reference: str) -> bool:
    """Check if the user with the given accountReference is a Student."""
    person = get_person(user_reference)
    if person and 'Student' in person.get('roles', []):
        return True
    return False


##########################################
#             Dependencies               #
##########################################

# Checks if User is Authenticated
async def get_current_user(request: Request):
    """
    FastAPI replacement for login_required. 
    Checks your session/cookie/token for the user reference.
    """
    user_ref = request.session.get("user")
    
    if not user_ref:
        raise NeedLoginException()

    person = get_person(user_ref)
    if not person or 'Student' not in person.get('roles', []):
        raise HTTPException(status_code=403, detail="Student role required")
        
    return person

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
    # TODO: Implement Auth0 login flow here.
    return {"message": "This will be the login page. Implement Auth0 login here."}

@app.get("/callback")
async def auth_callback(request: Request):
    # TODO: Implement Auth0 callback handling here.
    return {"message": "This will handle the Auth0 callback."}

@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    # TODO: Redirect to Auth0 logout URL if needed.
    return RedirectResponse(url="/")

############################################
#                  Server                  #
############################################
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)