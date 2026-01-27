import sqlite3
import os

DB_NAME = "game_database.db"

def _query(sql, params=(), fetchone=False):
    """Internal helper to handle database connections and clean up. 
       Used Gemini to help refactor into this query function"""

    if not os.path.exists(DB_NAME):
        return None
    
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sql, params)
        if fetchone:
            res = cursor.fetchone()
            return dict(res) if res else None
        return [dict(row) for row in cursor.fetchall()]

def get_person(account_reference):
    """
    Retrieve user information by accountReference (user identifier).
    Returns a joined result of Account and AccountRole tables.

    Args:
        account_reference (str): The accountReference value to look up

    Returns:
        dict: Contains account info and list of roles, or None if not found
        Example: {
            'accountID': '...',
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
        "SELECT * FROM Account WHERE accountReference = ?", 
        (account_reference,), 
        fetchone=True
    )
    
    if not account:
        return None

    # Get all roles for this account
    roles_rows = _query(
        "SELECT role FROM AccountRole WHERE accountID = ?", 
        (account['accountID'],)
    )
    account['roles'] = [r['role'] for r in roles_rows]
    
    # Remove sensitive data
    account.pop('passwordHash', None)
    return account

def get_tree(account_reference):
    """
    Retrieve tree information for a given user by accountReference.

    Args:
        account_reference (str): The accountReference value to look up.

    Returns:
        dict: Tree information or None if not found.
        Example: {
            'treeID': '...',
            'ownerAccountID': '...',
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
        "SELECT accountID FROM Account WHERE accountReference = ?", 
        (account_reference,), 
        fetchone=True
    )
    if not account:
        return None
    
    tree_data = _query(
        """
        SELECT t.*, r.water, r.earth, r.sun 
        FROM Tree t
        LEFT JOIN TreeResources r ON t.treeID = r.treeID
        WHERE t.ownerAccountID = ?
        """,
        (account['accountID'],),
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
            'water': tree_data.pop('water') or 0,
            'earth': tree_data.pop('earth') or 0,
            'sun': tree_data.pop('sun') or 0
        },
        'treeDecorations': decorations
    }