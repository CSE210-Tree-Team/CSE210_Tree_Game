"""
Database Item Retrieval Module

This module provides functions to query and retrieve data from the game database. It handles
retrieving account information, tree data, and related resources.

Functions:
    get_person(username): Retrieve account information including roles and sensitive data removed.
    get_tree(username): Retrieve complete tree data including resources and decorations for a user.

Returns:
    Dictionaries with structured data from the database, or None if not found.
"""

import sqlite3
import os
from config.settings import settings


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, settings.DB_NAME)

def _query(sql, params=(), fetchone=False):
    """Internal helper to handle database connections and clean up. 
       Used Gemini to help refactor into this query function"""

    if not os.path.exists(DB_PATH):
        return None
    
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sql, params)
        if fetchone:
            res = cursor.fetchone()
            return dict(res) if res else None
        return [dict(row) for row in cursor.fetchall()]

def get_student_details(username):
    """
    Retrieve student details by username.

    Returns:
        dict | None: Example: { 'studentUsername': '...', 'studentLevel': 1, 'studentStats': '{...}', 'parentEmail': '...' }
    """
    return _query(
        "SELECT studentUsername, studentLevel, studentStats, parentEmail FROM StudentDetails WHERE studentUsername = ?",
        (username,),
        fetchone=True,
    )

def get_person(username):
    """
    Retrieve user information by username (user identifier).
    Returns a joined result of Account and AccountRole tables.

    Args:
        username (str): The username value to look up

    Returns:
        dict: Contains account info and list of roles, or None if not found
        Example: {
            'username': '...',
            'email': '...',
            'displayName': '...',
            'accountReference': '...',
            'dateOfBirth': '...',
            'lastLogin': '...',
            'roles': ['Student', 'Teacher']
        }
    """

    account = _query(
        "SELECT * FROM Account WHERE username = ?", 
        (username,),
        fetchone=True
    )
    
    if not account:
        return None

    # Get all roles for this account
    roles_rows = _query(
        "SELECT role FROM AccountRole WHERE username = ?", 
        (account['username'],)
    )
    account['roles'] = [r['role'] for r in roles_rows]
    
    # Remove sensitive data
    account.pop('passwordHash', None)
    return account

def get_tree(username):
    """
    Retrieve tree information for a given user by username.

    Args:
        username (str): The username value to look up.

    Returns:
        dict: Tree information or None if not found.
        Example: {
            'treeID': '...',
            'ownerUsername': '...',
            'health': 'Healthy',   -- One of 'Dead', 'Withered', 'Unhealthy', 'Healthy'
            'growthStage': 0,      -- Integer representing growth stage. Currently unspecified meaning.
            'lastUpdated': '...'
            'resourceLevels': {
                'water': 0,
                'earth': 0,
                'sun': 0
            }
            'treeDecorations': [ ... ]  -- List of decorations on the tree. Currently unspecified meaning.
        }
    """

    account = _query(
        "SELECT username FROM Account WHERE username = ?", 
        (username,), 
        fetchone=True
    )
    if not account:
        return None
    
    tree_data = _query(
        """
        SELECT t.*, r.water, r.earth, r.sun 
        FROM Tree t
        LEFT JOIN TreeResources r ON t.treeID = r.treeID
        WHERE t.ownerUsername = ?
        """,
        (account['username'],),
        fetchone=True
    )

    if not tree_data:
        return None

    decorations = _query(
        "SELECT * FROM TreeDecoration WHERE treeID = ?", 
        (tree_data['treeID'],)
    )

    return {
        **tree_data,
        'resourceLevels': {
            'water': (tree_data.pop('water') or 0) if tree_data.get('water') is not None else 0,
            'earth': (tree_data.pop('earth') or 0) if tree_data.get('earth') is not None else 0,
            'sun': (tree_data.pop('sun') or 0) if tree_data.get('sun') is not None else 0
        },
        'treeDecorations': decorations
    }

def get_question(questionID):
    """
    Retrieve question information by questionID.

    Args:
        questionID (str): The questionID value to look up.

    Returns:
        dict: Question information with choices or None if not found.
        Example: {
            'questionID': '...',
            'text': '...',
            'type': 'MCQ',
            'difficulty': 1,
            'resourceType': 'Water',
            'choices': [
                {'text': 'choice1', 'isCorrect': True},
                {'text': 'choice2', 'isCorrect': False}
            ]
        }
    """

    question = _query(
        "SELECT questionID, text, type, difficulty, resourceType FROM Question WHERE questionID = ?", 
        (questionID,), 
        fetchone=True
    )
    
    if not question:
        return None

    choices = _query(
        "SELECT text, isCorrect FROM QuestionChoice WHERE questionID = ?", 
        (questionID,)
    )

    return {
        'questionID': question['questionID'],
        'text': question['text'],
        'type': question['type'],
        'difficulty': question['difficulty'],
        'resourceType': question['resourceType'],
        'choices': [{'text': c['text'], 'isCorrect': bool(c['isCorrect'])} for c in choices]
    }

def get_questions(num_questions=None, resource_type=None, question_type=None, difficulty=None):
    """
    Retrieve multiple questions from the database with optional filters.
    Returns random questions matching the criteria.

    Args:
        num_questions (int, optional): Maximum number of questions to return. If None, returns all matching questions.
        resource_type (str, optional): Filter by resource type ('water', 'earth', 'sun', 'general', etc.)
        question_type (str, optional): Filter by question type ('MCQ', 'FreeResponse', 'MultiSelect')
        difficulty (int, optional): Filter by difficulty level

    Returns:
        list: List of question dictionaries, each containing:
            {
                'questionID': '...',
                'text': '...',
                'type': 'MCQ',
                'difficulty': 1,
                'resourceType': 'water',
                'choices': [{'text': '...', 'isCorrect': True/False}, ...]
            }
    """
    # Build the WHERE clause based on provided filters
    where_clauses = []
    params = []
    
    if resource_type:
        # Normalize resource_type to lowercase for case-insensitive comparison
        where_clauses.append("resourceType = ?")
        params.append(resource_type.lower())
    
    if question_type:
        where_clauses.append("type = ?")
        params.append(question_type)
    
    if difficulty is not None:
        where_clauses.append("difficulty = ?")
        params.append(difficulty)
    
    # Construct the SQL query
    where_sql = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    # Get questions with random ordering
    sql = f"""
        SELECT questionID, text, type, difficulty, resourceType 
        FROM Question
        {where_sql}
        ORDER BY RANDOM()
    """
    
    # Add limit if num_questions is specified
    if num_questions is not None:
        sql += f" LIMIT {int(num_questions)}"
    
    questions = _query(sql, tuple(params))
    
    if not questions:
        return []
    
    # For each question, get its choices
    result = []
    for question in questions:
        choices = _query(
            "SELECT text, isCorrect FROM QuestionChoice WHERE questionID = ? ORDER BY choiceID",
            (question['questionID'],)
        )
        
        result.append({
            'questionID': question['questionID'],
            'text': question['text'],
            'type': question['type'],
            'difficulty': question['difficulty'],
            'resourceType': question['resourceType'],
            'choices': [{'text': c['text'], 'isCorrect': bool(c['isCorrect'])} for c in choices]
        })
    
    return result

def get_all_trees():
    """
    Retrieve all trees from the database.

    Returns:
        list: List of tree dictionaries, each containing:
            {
                'treeID': '...',
                'ownerUsername': '...',
                'health': 'Healthy',
                'growthStage': 0,
                'lastUpdated': '...'
            }
    """
    trees = _query("SELECT treeID FROM Tree")
    return trees if trees else []
