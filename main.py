
import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import find_dotenv, load_dotenv
from functools import wraps
import sqlite3
import os
from Database.getItemsFromDatabase import get_person, get_tree


##########################################
#            Global Variables            #
##########################################
app = FastAPI()
DATABASE_PATH = "Database/tree_game.db"
DB_NAME = "game_database.db"

# Setting Up Authentication Stuff
ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

# TODO: USet up oauth with Auth0.
# app.secret_key = env.get("APP_SECRET_KEY")
# oauth = OAuth(app)
# oauth.register(
#     "auth0",
#     client_id=env.get("AUTH0_CLIENT_ID"),
#     client_secret=env.get("AUTH0_CLIENT_SECRET"),
#     client_kwargs={
#         "scope": "openid profile email",
#     },
#     server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
# )


##########################################
#          Function Decorators           #
##########################################

# Checks if User is Authenticated
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # If user is not logged in, redirect to the login page
        if 'user' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Checks if User is Student
def student_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_ref = session.get('user')
        
        if not user_ref:
            return redirect(url_for('login', next=request.url))
        
        if not is_student(user_ref):
            return "Access denied: Student role required.", 403

        return f(*args, **kwargs)
    return decorated_function



############################################
#               Helper Functions           #
############################################

def is_student(user_reference: str) -> bool:
    """Check if the user with the given accountReference is a Student."""
    person = get_person(user_reference)
    if person and 'Student' in person.get('roles', []):
        return True
    return False


############################################
#                   Routes                 #
############################################
@app.get("/")
def default_page():
    return {"message": "Welcome to the Tree Game API! This will be the intro page."}


############################################
#                  Server                  #
############################################
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)