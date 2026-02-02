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
from constants import DB_NAME


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

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