"""
Database Item Addition and Update Module

This module provides functions to add and update data in the game database. It handles
account creation, role management, question setup, tree generation, resource updates,
event processing, and student enrollment.

Functions - Account Management:
    add_account(username, email, passwordHash, displayName, accountReference, dateOfBirth, role)
    add_role(username, role)
    update_account(username, display_name, email)
    update_last_login(username)
    add_student_details(student_username, student_level, student_stats, parent_email)

Functions - Question Management:
    add_question_alone(question_id, text, question_type, difficulty, resource_type)
    add_question_choice(choice_id, question_id, text, is_correct)

Functions - Tree & Resource Management:
    generate_tree(username)
    update_stat(tree_ID, stat_name, value)
    update_health(tree_ID, health_status)  # Updates the overall health status of the tree (healthy, unhealthy, etc.)
    do_event(tree_ID, event, value)

Functions - Class Management:
    join_class(student_username, class_code)
"""

import sqlite3
import os
from datetime import datetime
from constants import (
    DB_NAME, ROLE_STUDENT, ROLE_TEACHER, VALID_ROLES,
    HEALTH_HEALTHY, VALID_HEALTH_STATUSES,
    RESOURCE_WATER, RESOURCE_EARTH, RESOURCE_SUN, RESOURCE_ALL, RESOURCE_NONE,
    VALID_QUESTION_TYPES, VALID_QUESTION_RESOURCE_TYPES,
    ATTEMPT_RESOURCE_NONE, EVENT_LEVEL, EVENT_BONUS, EVENT_PENALTY, EVENT_NEUTRAL,
    RESOURCE_MAX_LEVEL, RESOURCE_MIN_LEVEL
)
import dataRecords as dataclasses
import uuid


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_NAME)


def _execute(sql, params=(), commit=True):
    """Internal helper to handle database connections and execute queries."""
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database {DB_PATH} does not exist. Please create it first.")
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        if commit:
            conn.commit()
        return cursor.lastrowid


def add_account(username: str, email: str, passwordHash: str, displayName: str, 
                accountReference: str, dateOfBirth: str, role: str) -> str:
    """
    Create a new account in the database.
    
    Args:
        username: Unique username
        email: Email address
        passwordHash: Hashed password
        displayName: Display name for the user
        accountReference: Reference identifier for the account
        dateOfBirth: Date of birth (format: YYYY-MM-DD)
        role: User role ('Student' or 'Teacher')
    
    Returns:
        str: The username
    
    Raises:
        ValueError: If role is invalid or required fields are missing
        sqlite3.IntegrityError: If username already exists
    """
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of {VALID_ROLES}")
    
    if not all([username, email, passwordHash, accountReference]):
        raise ValueError("username, email, passwordHash, and accountReference are required")
    
    sql = '''
        INSERT INTO Account (username, email, passwordHash, displayName, accountReference, dateOfBirth, lastLogin)
        VALUES (?, ?, ?, ?, ?, ?, NULL)
    '''
    
    _execute(sql, (username, email, passwordHash, displayName, accountReference, dateOfBirth))
    
    # Add the role
    add_role(username, role)
    
    return username

def add_question(text: str, question_type: str, resource_type: str, choices: list, correct_choices: list, check_duplicates: bool = True) -> str:
    """
    Add a new question with choices to the database.
    
    Args:
        text: The question text
        question_type: Type of question ('MCQ', 'FreeResponse', or 'MultiSelect')
        resource_type: Resource type ('Water', 'Earth', 'Sun', 'General', or 'None')
        choices: List of choice texts
        correct_choices: List of indices indicating which choices are correct
        check_duplicates: Whether to check for duplicate questions (default: True)
    
    Returns:
        str: The question ID
    
    Raises:
        ValueError: If question_type or resource_type is invalid, or if duplicate exists
    """
    if question_type not in VALID_QUESTION_TYPES:
        raise ValueError(f"Invalid question type '{question_type}'. Must be one of {VALID_QUESTION_TYPES}")
    
    if resource_type and resource_type not in VALID_QUESTION_RESOURCE_TYPES:
        raise ValueError(f"Invalid resource type '{resource_type}'. Must be one of {VALID_QUESTION_RESOURCE_TYPES}")
    
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database {DB_PATH} does not exist. Please create it first.")
    
    # Check for duplicates if requested
    if check_duplicates:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Find questions with the same text
            cursor.execute("SELECT questionID FROM Question WHERE text = ?", (text,))
            potential_duplicates = cursor.fetchall()
            
            if potential_duplicates and choices:
                # Check if any have the same choices
                for (question_id,) in potential_duplicates:
                    cursor.execute(
                        "SELECT text, isCorrect FROM QuestionChoice WHERE questionID = ? ORDER BY text",
                        (question_id,)
                    )
                    existing_choices = cursor.fetchall()
                    
                    # Prepare current choices for comparison
                    current_choices = sorted([
                        (choice_text, 1 if idx in correct_choices else 0)
                        for idx, choice_text in enumerate(choices)
                    ], key=lambda x: x[0])
                    
                    if existing_choices == current_choices:
                        raise ValueError(f"Duplicate question detected with questionID: {question_id}")
    
    q_id = str(uuid.uuid4())
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Insert Question
        cursor.execute(
            "INSERT INTO Question (questionID, text, type, difficulty, resourceType) VALUES (?, ?, ?, ?, ?)",
            (q_id, text, question_type, 1, resource_type)
        )
        
        # Insert Choices (if any)
        if choices:
            for idx, choice_text in enumerate(choices):
                is_correct = 1 if idx in correct_choices else 0
                cursor.execute(
                    "INSERT INTO QuestionChoice (choiceID, questionID, text, isCorrect) VALUES (?, ?, ?, ?)",
                    (str(uuid.uuid4()), q_id, choice_text, is_correct)
                )
        
        conn.commit()
    
    return q_id

def add_role(username: str, role: str):
    """
    Add a role to an existing account. An account can have multiple roles (Student, Teacher).
    
    Args:
        username: The username to add the role to
        role: The role to add ('Student' or 'Teacher')
    
    Raises:
        ValueError: If role is invalid
        sqlite3.IntegrityError: If the role already exists for this account
    """
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of {VALID_ROLES}")
    
    sql = '''
        INSERT INTO AccountRole (username, role)
        VALUES (?, ?)
    '''
    
    _execute(sql, (username, role))


def add_question_alone(question_id: str, text: str, question_type: str, difficulty: int = None, 
                 resource_type: str = None) -> str:
    """
    Add a new question to the database.
    
    Args:
        question_id: Unique question identifier
        text: The question text
        question_type: Type of question ('MCQ', 'FreeResponse', or 'MultiSelect')
        difficulty: Difficulty level (optional)
        resource_type: Resource type ('Water', 'Earth', 'Sun', or 'General')
    
    Returns:
        str: The question ID
    
    Raises:
        ValueError: If question_type or resource_type is invalid
    """
    if question_type not in VALID_QUESTION_TYPES:
        raise ValueError(f"Invalid question type '{question_type}'. Must be one of {VALID_QUESTION_TYPES}")
    
    if resource_type and resource_type not in VALID_QUESTION_RESOURCE_TYPES:
        raise ValueError(f"Invalid resource type '{resource_type}'. Must be one of {VALID_QUESTION_RESOURCE_TYPES}")
    
    sql = '''
        INSERT INTO Question (questionID, text, type, difficulty, resourceType)
        VALUES (?, ?, ?, ?, ?)
    '''
    
    _execute(sql, (question_id, text, question_type, difficulty, resource_type))
    return question_id


def add_question_choice(choice_id: str, question_id: str, text: str, is_correct: bool = False):
    """
    Add a choice/option to a question (for MCQ or MultiSelect).
    
    Args:
        choice_id: Unique choice identifier
        question_id: The question this choice belongs to
        text: The choice text
        is_correct: Whether this is a correct answer (default: False)
    """
    sql = '''
        INSERT INTO QuestionChoice (choiceID, questionID, text, isCorrect)
        VALUES (?, ?, ?, ?)
    '''
    
    _execute(sql, (choice_id, question_id, text, 1 if is_correct else 0))

def do_event(tree_ID: str, event: dataclasses.Event, value: int):
    """
    Handle an event for a tree, updating its resources based on the event type.
    
    Args:
        tree_ID: The tree to apply the event to
        event: The Event object containing event details
        value: The multiplier or amount to apply
    
    Raises:
        ValueError: If the event resource is invalid
    """
    
    # Determine which resources to update
    if event.resourceAffected == RESOURCE_ALL:
        resources = [RESOURCE_WATER, RESOURCE_EARTH, RESOURCE_SUN]
    elif event.resourceAffected == RESOURCE_NONE:
        return  # No resources affected
    else:
        resources = [event.resourceAffected]
    
    # Calculate the change amount
    if event.eventType == EVENT_BONUS:
        change = abs(value)
    elif event.eventType == EVENT_PENALTY:
        change = -(abs(value))
    else:
        change = 0
    
    # Apply the change to each affected resource
    for resource in resources:
        update_stat(tree_ID, resource.lower(), change)


def update_stat(tree_ID: str, stat_name: str, value: int):
    """
    Update a resource stat (water, earth, or sun) for a tree.
    
    Args:
        tree_ID: The tree to update
        stat_name: The stat name ('water', 'earth', or 'sun')
        value: The amount to add/subtract (can be negative)
    
    Raises:
        ValueError: If stat_name is invalid
    """
    stat_name_lower = stat_name.lower()
    valid_stats = ['water', 'earth', 'sun']
    
    if stat_name_lower not in valid_stats:
        raise ValueError(f"Invalid stat name '{stat_name}'. Must be one of {valid_stats}")
    
    sql = f'''
        UPDATE TreeResources
        SET {stat_name_lower} = CASE 
            WHEN {stat_name_lower} + ? < {RESOURCE_MIN_LEVEL} THEN {RESOURCE_MIN_LEVEL}
            WHEN {stat_name_lower} + ? > {RESOURCE_MAX_LEVEL} THEN {RESOURCE_MAX_LEVEL}
            ELSE {stat_name_lower} + ?
        END
        WHERE treeID = ?
    '''
    
    _execute(sql, (value, value, value, tree_ID))


def update_health(tree_ID: str, health_status: str):
    """
    Update the health status of a tree.
    
    Args:
        tree_ID: The tree to update
        health_status: New health status ('Dead', 'Withered', 'Unhealthy', or 'Healthy')
    
    Raises:
        ValueError: If health_status is invalid
    """
    if health_status not in VALID_HEALTH_STATUSES:
        raise ValueError(f"Invalid health status '{health_status}'. Must be one of {VALID_HEALTH_STATUSES}")
    
    sql = '''
        UPDATE Tree
        SET health = ?, lastUpdated = ?
        WHERE treeID = ?
    '''
    
    _execute(sql, (health_status, datetime.now().isoformat(), tree_ID))


def update_account(username: str, display_name: str = None, email: str = None):
    """
    Update account information.
    
    Args:
        username: The account to update
        display_name: New display name (optional)
        email: New email (optional)
    """
    updates = []
    params = []
    
    if display_name is not None:
        updates.append("displayName = ?")
        params.append(display_name)
    
    if email is not None:
        updates.append("email = ?")
        params.append(email)
    
    if not updates:
        return  # Nothing to update
    
    params.append(username)
    
    sql = f'''
        UPDATE Account
        SET {', '.join(updates)}
        WHERE username = ?
    '''
    
    _execute(sql, params)


def update_last_login(username: str):
    """
    Update the last login timestamp for an account.
    
    Args:
        username: The account to update
    """
    sql = '''
        UPDATE Account
        SET lastLogin = ?
        WHERE username = ?
    '''
    
    _execute(sql, (datetime.now().isoformat(), username))


def join_class(student_username: str, class_code: str):
    """
    Enroll a student in a class.
    
    Args:
        studentUsername: The student's username
        class_code: The class code (will be used to look up classID)
    
    Raises:
        ValueError: If the class is not found or student is not a student
    """
    # Look up the classID by code (assuming class code matches some identifier)
    # This may need adjustment based on your actual class identification strategy
    lookup_sql = "SELECT classID FROM Class WHERE classID = ? OR className = ?"
    
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(lookup_sql, (class_code, class_code))
        result = cursor.fetchone()
        
        if not result:
            raise ValueError(f"Class '{class_code}' not found")
        
        class_id = result['classID']
    
    # Insert enrollment
    sql = '''
        INSERT INTO Enrollment (username, classID)
        VALUES (?, ?)
    '''
    
    _execute(sql, (student_username, class_id))

def add_student_details(student_username: str, student_level: int = 1, student_stats: str = None, parent_email: str = None):
    """
    Add student-specific details to an account.
    
    Args:
        studentUsername: The student's username
        studentLevel: The student's level (default: 1)
        studentStats: JSON string of student stats
        parentEmail: Parent's email (optional)
    """
    sql = '''
        INSERT INTO StudentDetails (studentUsername, studentLevel, studentStats, parentEmail)
        VALUES (?, ?, ?, ?)
    '''
    
    _execute(sql, (student_username, student_level, student_stats, parent_email))

def generate_tree(username: str) -> str:
    """
    Generate a new tree for a user with default resources and healthy status.
    
    Args:
        username: The owner of the tree
    
    Returns:
        str: The tree ID
    """
    tree_id = str(uuid.uuid4())
    
    sql_tree = '''
        INSERT INTO Tree (treeID, ownerUsername, health, lastUpdated)
        VALUES (?, ?, ?, ?)
    '''
    
    sql_resources = '''
        INSERT INTO TreeResources (treeID, water, earth, sun)
        VALUES (?, ?, ?, ?)
    '''
    
    _execute(sql_tree, (tree_id, username, HEALTH_HEALTHY, datetime.now().isoformat()))
    _execute(sql_resources, (tree_id, 100, 100, 100))  # Default resources set to 100
    
    return tree_id