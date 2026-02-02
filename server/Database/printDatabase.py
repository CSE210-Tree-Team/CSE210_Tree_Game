"""
Database Content Display Module

This module provides utilities to print and display the complete contents of the game database
in a human-readable format. Useful for debugging and verifying database state.

Functions:
    print_database_contents(db_path): Print all tables and their records from the database.

Usage:
    python Database.printDatabase.py > db_dump.txt
    python Database.printDatabase.py

Note: Created this file was created with assistance from Gemini
"""

import sqlite3
import os
from constants import DB_NAME


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

# Credit to Gemini for generating this script.
# I would suggest running this with redirection to a file for easier viewing:
# python Database/print_database.py > db_dump.txt

def print_database_contents(db_path=DB_PATH):
    # Check if DB exists
    if not os.path.exists(db_path):
        print(f"Error: Database '{db_path}' not found.")
        print("Please run your generation script first.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Get a list of all tables in the database dynamically
    # We exclude 'sqlite_sequence' which is an internal SQLite table for autoincrement keys
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence';")
    tables = cursor.fetchall()

    if not tables:
        print("Connected to database, but no tables found.")
        return

    print(f"Successfully connected to {db_path}\n")

    # 2. Iterate through every table and print contents
    for table_name_tuple in tables:
        table_name = table_name_tuple[0]
        
        print(f"{'='*20} TABLE: {table_name} {'='*20}")
        
        # Get all data
        try:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            # Get column headers
            # cursor.description returns a tuple of descriptions, index 0 is the column name
            column_names = [description[0] for description in cursor.description]
            
            # Print Headers
            print(f"COLUMNS: {column_names}")
            print("-" * (len(str(column_names)) + 10))

            # Print Rows
            if not rows:
                print("   [EMPTY TABLE] - No data rows found.")
            else:
                for row in rows:
                    print(f"   {row}")
            
            print("\n") # Add spacing between tables

        except sqlite3.OperationalError as e:
            print(f"Could not read table {table_name}: {e}")

    conn.close()
    print("End of Database Dump.")

def print_condensed_user_info(db_path=DB_PATH):
    if not os.path.exists(db_path):
        print(f"Error: Database '{db_path}' not found.")
        print("Please run your generation script first.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT username, displayName, email, lastLogin FROM Account")
        accounts = cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"Unable to read Account table: {e}")
        conn.close()
        return

    if not accounts:
        print("No accounts found in the database.")
        conn.close()
        return

    cursor.execute("SELECT username, role FROM AccountRole")
    roles = cursor.fetchall()
    role_map = {}
    for username, role in roles:
        role_map.setdefault(username, []).append(role)
    cursor.execute("SELECT studentUsername, studentLevel, studentStats FROM StudentDetails")
    student_rows = cursor.fetchall()
    student_map = {student_username: (level, stats) for student_username, level, stats in student_rows}

    cursor.execute(
        """
        SELECT t.ownerUsername, t.treeID, t.health, t.growthStage, t.lastUpdated,
               COALESCE(r.water, 0), COALESCE(r.earth, 0), COALESCE(r.sun, 0)
        FROM Tree t
        LEFT JOIN TreeResources r ON t.treeID = r.treeID
        """
    )
    tree_rows = cursor.fetchall()
    tree_map = {}
    for owner_username, tree_id, health, growth, updated, water, earth, sun in tree_rows:
        tree_map.setdefault(owner_username, []).append({
            "tree_id": tree_id,
            "health": health,
            "growth": growth,
            "updated": updated,
            "water": water,
            "earth": earth,
            "sun": sun,
        })

    print("\n=================== User Overview ===================")
    for username, display_name, email, last_login in accounts:
        friendly_id = username[:8]
        name = display_name or "(no display name)"
        user_roles = ", ".join(role_map.get(username, ["(no role)"]))
        status_parts = []
        if username in student_map:
            level, stats = student_map[username]
            status_parts.append(f"Level {level}")
            if stats:
                status_parts.append(f"Stats: {stats}")
        if last_login:
            status_parts.append(f"Last login: {last_login}")
        status = " | ".join(status_parts) if status_parts else "No status info"

        print(f"\nUser: {name} ({username}) [ID: {friendly_id}]")
        print(f"  Email: {email}")
        print(f"  Roles: {user_roles}")
        print(f"  Status: {status}")

        trees = tree_map.get(username, [])
        if not trees:
            print("  Tree: None assigned")
        else:
            for tree in trees:
                print(
                    f"  Tree {tree['tree_id'][:8]} | Health: {tree['health']} | "
                    f"Growth: {tree['growth']} | Updated: {tree['updated']}"
                )
                print(
                    f"    Resources -> Water: {tree['water']}, Earth: {tree['earth']}, Sun: {tree['sun']}"
                )

    conn.close()

if __name__ == "__main__":
    print_database_contents(db_path=DB_PATH)

    print("\n\n=================== End of Database Contents ====================\n\n")

    print_condensed_user_info(db_path=DB_PATH)