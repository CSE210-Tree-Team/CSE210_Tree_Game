import os
import uvicorn
import asyncio
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from Database.getItemsFromDatabase import get_person, get_tree, get_question, get_questions, get_all_trees
from Database.addItemsToDatabase import add_account, generate_tree, add_question, update_last_login, apply_passive_decay, update_stat
from constants import ROLE_STUDENT, PASSIVE_DECAY_RATE
from dataRecords import Tree, Event, DUMMY_EVENT
from email.message import EmailMessage
import smtplib


############################################
#               App Setup                  #
############################################

# For Sending Messages
CARRIERS = {
    "att": "@mms.att.net",
    "tmobile": "@tmomail.net",
    "verizon": "@vtext.com",
    "sprint": "@messaging.sprintpcs.com"
}

load_dotenv()
app = FastAPI()
MIDDLEWARE_SECRET_KEY = os.getenv("MIDDLEWARE_SECRET_KEY")
app.add_middleware(SessionMiddleware, secret_key=MIDDLEWARE_SECRET_KEY)
decay_task = None

# --- Static File Serving ---
frontend_path = os.path.join("..", "client", "dist")
if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="static")
# TODO: Need to fix log out process so that session is properly cleared.

async def run_passive_decay_loop():
    """
    Background task that applies passive decay to all trees every PASSIVE_DECAY_RATE minutes.
    """
    while True:
        try:
            # Get all trees from the database
            all_trees = get_all_trees()
            
            for tree_row in all_trees:
                tree_id = tree_row['treeID']
                apply_passive_decay(tree_id)
            
            # Sleep for PASSIVE_DECAY_RATE minutes (converted to seconds)
            await asyncio.sleep(PASSIVE_DECAY_RATE * 60)
        except Exception as e:
            print(f"Error in passive decay loop: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    """Start the passive decay background task when the app starts."""
    global decay_task
    decay_task = asyncio.create_task(run_passive_decay_loop())
    
    # send_email("adrian.s.rosing@gmail.com", DUMMY_EVENT)  # Test email sending on startup
    
    print("Passive decay background task started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cancel the passive decay background task when the app shuts down."""
    global decay_task
    if decay_task:
        decay_task.cancel()
    print("Passive decay background task stopped")

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

def send_email(target_user : str, event : dict | Event):
    event_data = event.__dict__ if isinstance(event, Event) else event
    event_str = f"Event Type: {event_data['eventType']}, Resource Affected: {event_data['resourceAffected']}, Description: {event_data['description']}, Stat Changes: {event_data['percentChange']}%, Conditions Met: {event_data['conditions']}"
    print(f"Preparing to send email to {target_user} with message: {event_str}")
    try:
        # TODO: Implement Events more in-depth if we have time.
        # Access Stuff
        # phone_email = f"{userInfo[3]}" + CARRIERS[userInfo[4]]
        message = f"Your tree just experienced the following event: {event_str}"

        # TODO: Update email once we have a domain.
        # Email server configuration
        sender_email = "potplugtesting@gmail.com"  # Normal Email - pass is Testing123~
        password = str(os.getenv("EMAIL_PASSWORD"))
    except:
        print("Failed to find user.")
        return {"User Not Found."}

    # Sends Message
    try:
        email_msg = EmailMessage()
        email_msg["From"] = sender_email
        email_msg["To"] = target_user
        email_msg["Subject"] = "Tree Event Update"
        email_msg.set_content(message)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.send_message(email_msg)
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")

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

############################################
#               API Endpoints              #
############################################

@app.post("/api/auth/verify")
async def verify_auth(request: Request):
    """Verify Auth0 token and establish backend session."""
    try:
        data = await request.json()
        user_data = data.get('user', {})
        
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

            update_last_login(username)
            
            return {"success": True, "message": "Session established"}
        
        return {"success": False, "message": "No user data provided"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/get-user-info")
def get_user_info(request: Request, student=Depends(student_required)):
    """
    Returns the user information and tree stats. Applies passive decay before returning tree data.

    Returns:
    {
        "success": True,
        "user": {
            "username": str,
            "displayName": str,
            "email": str,
            "roles": [str]
        },
        "tree": {
            "treeID": str,
            "health": str,
            "growthStage": int,
            "resourceLevels": {"water": int, "earth": int, "sun": int}
        }
    }
    """
    username = student.get("username") if student else None
    tree = get_tree(username) if student else None
    
    # Apply passive decay to tree before returning
    if tree:
        apply_passive_decay(tree['treeID'])
        # Refresh tree data after decay TODO: Update appearance as needed.
        tree = get_tree(username)

    return {
        "success": True,
        "user": {
            "username": student.get("username"),
            "displayName": student.get("displayName"),
            "email": student.get("email"),
            "roles": student.get("roles", [])
        },
        "tree": {
            "treeID": tree.get('treeID') if tree else None,
            "health": tree.get('health') if tree else None,
            "growthStage": tree.get('growthStage') if tree else None,
            "resourceLevels": tree.get('resourceLevels') if tree else None
        }
    }

@app.post("/api/update-stat")
async def api_update_stat(request: Request, student=Depends(student_required)):
    """
    Updates a specific stat for the student's tree. NOTE: TODO: Treats this update as an event. This does not affect functionality
    
    Request body:
    {
        "stat_name": "water",   // "water", "earth", or "sun"
        "value": 10             // amount to add/subtract
    }
    """
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    
    stat_name = data.get("stat_name")
    value = data.get("value")
    
    # Get tree from student's username
    username = student.get("username") if student else None
    tree = get_tree(username) if username else None
    tree_id = tree.get('treeID') if tree else None
    
    if not stat_name:
        raise HTTPException(status_code=400, detail="stat_name is required")
    if value is None:
        raise HTTPException(status_code=400, detail="value is required")
    if not isinstance(value, int) or isinstance(value, bool):
        raise HTTPException(status_code=400, detail="value must be an integer")
    if not tree_id:
        raise HTTPException(status_code=404, detail="Tree not found for user")
    
    # TODO: Refactor into events potentially.
    try:
        print(f"Received update-stat request: stat_name={stat_name}, value={value} for user {student['username']} and tree {tree_id}")
        update_stat(tree_id, stat_name, value)
        return {"success": True, "message": f"{stat_name} updated by {value}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update stat: {str(e)}")

@app.post("/api/update-user")
async def update_user(request: Request, account=Depends(get_current_user)):
    """
    API endpoint to update user information.
    """
    # TODO: Implement user update logic here.
    return None


@app.post("/api/add-question")
async def api_add_question(request: Request, student=Depends(student_required)):
    """
    API endpoint to add a question to the database.
    
    Request body:
    {
        "text": "What color is the sun?",
        "question_type": "MCQ",
        "resource_type": "Sun",
        "choices": ["Yellow", "Green", "Blue"],
        "correct_choices": [0],
        "check_duplicates": true  // optional, defaults to true
    }

    Returns:
    {
        "success": True,
        "message": "Question added successfully",
        "questionID": "uuid-string"
    }

    Note: correct_choices is a list of indices in the choices array, so multiple correct answers are possible.
    """
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    
    text = data.get("text")
    question_type = data.get("question_type")
    resource_type = data.get("resource_type")
    choices = data.get("choices", [])
    correct_choices = data.get("correct_choices", [])
    check_duplicates = data.get("check_duplicates", True)
    
    if not text:
        raise HTTPException(status_code=400, detail="Question text is required")
    
    try:
        question_id = add_question(text, question_type, resource_type, choices, correct_choices, check_duplicates)
        return {
            "success": True,
            "message": "Question added successfully",
            "questionID": question_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add question: {str(e)}")

# Get single question:
@app.post("/api/get-question")
async def api_get_question(request: Request, student=Depends(student_required)):
    """
    API endpoint to retrieve a single question from the database.

    Request body:
    {
        "questionID": "uuid-string"
    }

    Returns: Question information or error.
    {
        "success": True,
        "question": {
            'questionID': '...',
            'text': '...',
            'choices': ['choice1', 'choice2', ...],
            'correct_choices': [0, 2]  -- List of indices in choices array that are correct
        }
    }
    """
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    
    question_id = data.get("questionID")
    
    if not question_id:
        raise HTTPException(status_code=400, detail="questionID is required")
    
    try:
        question = get_question(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {
            "success": True,
            "question": question
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve question: {str(e)}")

# Get multiple questions:
@app.post("/api/get-questions")
async def api_get_questions(request: Request, student=Depends(student_required)):
    """
    API endpoint to retrieve multiple questions from the database.
    
    Request body:
    {
        "numQuestions": 5,              // optional - max number to return, null for all
        "resourceType": "Water",        // optional - filter by resource type
        "questionType": "MCQ",          // optional - filter by question type
        "difficulty": 1                 // optional - filter by difficulty level
    }
    
    Returns:
    {
        "success": True,
        "count": 3,
        "questions": [
            {
                "questionID": "uuid",
                "text": "Question text",
                "type": "MCQ",
                "difficulty": 1,
                "resourceType": "Water",
                "choices": [
                    {"text": "Option 1", "isCorrect": true},
                    {"text": "Option 2", "isCorrect": false}
                ]
            },
            ...
        ]
    }
    """
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    
    num_questions = data.get("numQuestions")
    resource_type = data.get("resourceType")
    question_type = data.get("questionType")
    difficulty = data.get("difficulty")
    
    try:
        questions = get_questions(
            num_questions=num_questions,
            resource_type=resource_type,
            question_type=question_type,
            difficulty=difficulty
        )
        return {
            "success": True,
            "count": len(questions),
            "questions": questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve questions: {str(e)}")

############################################
#                  Server                  #
############################################

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)