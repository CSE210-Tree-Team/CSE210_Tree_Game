import sqlite3
import uuid
import random
import datetime
import os
from Database import createDatabase
from constants import DB_NAME

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

### SAMPLE INPUT TEST DATA FOR GENERATION ###
STUDENT_NAMES = ["Adrian", "Dhaivat", "Cash", "Kathy", "Alex", "Stanley"]
QUESTIONS = [
    ("What color is the sun?", "MCQ", "Sun", ["Yellow", "Green", "Blue"], 0),
    ("2 + 2 = ?", "MCQ", "General", ["3", "4", "5"], 1),
    ("How do trees drink?", "FreeResponse", "Water", [], None),
    ("Select all primary colors.", "MultiSelect", "General", ["Red", "Green", "Blue", "Yellow"], [0, 2]),
]
DEFAULT_HEALTH_STATUS = "Healthy"
DEFAULT_RESOURCE_LEVEL = 100
DEFAULT_GROWTH_STAGE = 0


def generate_uuid():
    return str(uuid.uuid4())

def get_date_str():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Create a tree for a given account and return the treeID
def create_tree(conn, cursor, username):
    tree_id = generate_uuid()
    health_status = DEFAULT_HEALTH_STATUS
    cursor.execute('''
        INSERT INTO Tree (treeID, ownerUsername, health, growthStage, lastUpdated) 
        VALUES (?, ?, ?, ?, ?)
    ''', (tree_id, username, health_status, DEFAULT_GROWTH_STAGE, get_date_str()))

    cursor.execute("INSERT INTO TreeResources (treeID, water, earth, sun) VALUES (?, ?, ?, ?)",
                   (tree_id, DEFAULT_RESOURCE_LEVEL, DEFAULT_RESOURCE_LEVEL, DEFAULT_RESOURCE_LEVEL))
    return tree_id

# Creates account, makes tree for the account, and assigns them student role
def add_students(conn, cursor):
    for name in STUDENT_NAMES:
        s_id = generate_uuid()
        username = name.lower()
        
        # Create Account
        cursor.execute('''
            INSERT INTO Account (username, email, passwordHash, displayName, dateOfBirth, lastLogin) 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, f"{username}@student.edu", "pass123", name, "2010-01-01", get_date_str()))
        
        # Assign Role
        cursor.execute("INSERT INTO AccountRole (username, role) VALUES (?, ?)", (username, 'Student'))

        # Student Details
        cursor.execute("INSERT INTO StudentDetails (studentUsername, studentLevel, studentStats) VALUES (?, ?, ?)",
                       (username, 1, '{"xp": 0}'))
                       
        # Create a Tree for the account.
        tree_id = create_tree(conn, cursor, username)

# Create questions in the database
def add_questions(conn, cursor):
    for text, q_type, res_type, choices, correct_data in QUESTIONS:
        q_id = generate_uuid()
        
        # Insert Question
        cursor.execute("INSERT INTO Question (questionID, text, type, difficulty, resourceType) VALUES (?, ?, ?, ?, ?)",
                       (q_id, text, q_type, 1, res_type))
        
        # Insert Choices (if any)
        if choices:
            for idx, choice_text in enumerate(choices):
                is_correct = 0
                
                # Handle MultiSelect (List of indices) vs MCQ (Single Int index)
                if isinstance(correct_data, list):
                    if idx in correct_data:
                        is_correct = 1
                elif isinstance(correct_data, int):
                    if idx == correct_data:
                        is_correct = 1
                
                cursor.execute("INSERT INTO QuestionChoice (choiceID, questionID, text, isCorrect) VALUES (?, ?, ?, ?)",
                               (generate_uuid(), q_id, choice_text, is_correct))

def generate_data(db_path=DB_PATH):
    # Ensure schema exists first
    createDatabase.create_schema(db_path=db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    print(f"Generating data for {len(STUDENT_NAMES)} students (No Classes/Teachers)...")
    add_students(conn, cursor)

    print(f"Creating {len(QUESTIONS)} questions...")
    add_questions(conn, cursor)

    conn.commit()
    conn.close()
    print("Data generation complete.")

if __name__ == "__main__":
    generate_data(db_path=DB_PATH)