"""
Database Schema Creation Module

This module handles the initial creation of the game database schema and all required tables.

Functions:
    create_schema(db_path): Creates all database tables with proper constraints and relationships.

Tables Created:
    - Account: User account information
    - AccountRole: User roles (Student/Teacher)
    - Tree: Tree data for each user
    - TreeResources: Resource levels (water, earth, sun) for each tree
    - TreeDecoration: Decorations applied to trees
    - Event: Game events that affect resources
    - Class: Classes created by teachers
    - Enrollment: Student enrollment in classes
    - Question: Quiz questions
    - QuestionChoice: Multiple choice options for questions
    - QuestionClass: Association between questions and classes
    - QuestionAttempt: Logging of student question attempts
    - StudentDetails: Student-specific information and stats
"""

import sqlite3
import os
from config.settings import settings


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, settings.DB_NAME)

def create_schema(db_path=DB_PATH):

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Foreign key constraints are enforced
    cursor.execute("PRAGMA foreign_keys = ON;")

    print(f"Connected to {db_path}. Creating tables...")

    # Account Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Account (
        username TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        displayName TEXT,
        accountReference TEXT,
        dateOfBirth TEXT,
        lastLogin TEXT
    )
    ''')

    # AccountRole Table
    # Constraint: username is unique here, effectively making this 1:1 or 1:Many restricted by PK
    # role can only be 'Student' or 'Teacher'
    cursor.execute(f'''
    CREATE TABLE IF NOT EXISTS AccountRole (
        username TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('{settings.ROLE_STUDENT}', '{settings.ROLE_TEACHER}')),
        PRIMARY KEY (username, role),
        FOREIGN KEY (username) REFERENCES Account(username) ON DELETE CASCADE
    )
    ''')

    # Tree Table
    # health can be 'Healthy', 'Unhealthy', or 'Withered' based on resource levels
    # growthStage is an INTEGER representing stages of growth --> currently undefined specification
    cursor.execute(f'''
    CREATE TABLE IF NOT EXISTS Tree (
        treeID TEXT PRIMARY KEY,
        ownerUsername TEXT NOT NULL,
        health TEXT NOT NULL CHECK(health IN ('{settings.HEALTH_HEALTHY}', '{settings.HEALTH_UNHEALTHY}', '{settings.HEALTH_WITHERED}')),
        growthStage INTEGER DEFAULT 0,
        lastUpdated TEXT,
        FOREIGN KEY (ownerUsername) REFERENCES Account(username) ON DELETE CASCADE
    )
    ''')

    # TreeResources Table
    # treeID is FK and UNIQUE (1:1 relationship with Tree)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS TreeResources (
        treeID TEXT PRIMARY KEY,
        water INTEGER NOT NULL DEFAULT 0,
        earth INTEGER NOT NULL DEFAULT 0,
        sun INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (treeID) REFERENCES Tree(treeID) ON DELETE CASCADE
    )
    ''')

    # TreeDecoration Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS TreeDecoration (
        decorationID INTEGER PRIMARY KEY AUTOINCREMENT,
        treeID TEXT NOT NULL,
        appearanceID INTEGER,
        FOREIGN KEY (treeID) REFERENCES Tree(treeID) ON DELETE CASCADE
    )
    ''')

    # Event Table
    # eventType can only be 'Level', 'Bonus', 'Penalty', 'Neutral'
    # resourceAffected can be 'water', 'earth', 'sun', 'none', 'all' (lowercase)
    cursor.execute(f'''
    CREATE TABLE IF NOT EXISTS Event (
        eventID TEXT PRIMARY KEY,
        eventType TEXT NOT NULL CHECK(eventType IN ('{settings.EVENT_LEVEL}', '{settings.EVENT_BONUS}', '{settings.EVENT_PENALTY}', '{settings.EVENT_NEUTRAL}')),
        resourceAffected TEXT CHECK(resourceAffected IN ('{settings.RESOURCE_WATER}', '{settings.RESOURCE_EARTH}', '{settings.RESOURCE_SUN}', '{settings.RESOURCE_NONE}', '{settings.RESOURCE_ALL}')),
        description TEXT,
        percentChange INTEGER,
        conditions TEXT
    )
    ''')

    # Class Table
    # levelPolicy == 1 means students cannot do questions outside their level.
    # levelPolicy == 0 means no restrictions and is default.
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Class (
        classID TEXT PRIMARY KEY,
        className TEXT NOT NULL,
        classLevel INTEGER,
        teacherUsername TEXT NOT NULL,
        active INTEGER DEFAULT 1 CHECK(active IN (0, 1)), -- Boolean (0 or 1)
        levelPolicy INTEGER DEFAULT 0 CHECK(levelPolicy IN (0, 1)), -- Boolean
        FOREIGN KEY (teacherUsername) REFERENCES Account(username)
    )
    ''')

    # Enrollment Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Enrollment (
        username TEXT NOT NULL,
        classID TEXT NOT NULL,
        PRIMARY KEY (username, classID),
        FOREIGN KEY (username) REFERENCES Account(username) ON DELETE CASCADE,
        FOREIGN KEY (classID) REFERENCES Class(classID) ON DELETE CASCADE
    )
    ''')

    # Question Table
    # type can be 'MCQ', 'FreeResponse', 'MultiSelect'
    # resourceType can be 'water', 'earth', 'sun', 'general' (lowercase)  --> General means all resources
    cursor.execute(f'''
    CREATE TABLE IF NOT EXISTS Question (
        questionID TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('{settings.QUESTION_MCQ}', '{settings.QUESTION_FREE_RESPONSE}', '{settings.QUESTION_MULTI_SELECT}')),
        difficulty INTEGER,
        resourceType TEXT CHECK(resourceType IN ('{settings.QUESTION_RESOURCE_WATER}', '{settings.QUESTION_RESOURCE_EARTH}', '{settings.QUESTION_RESOURCE_SUN}', '{settings.QUESTION_RESOURCE_GENERAL}'))
    )
    ''')

    # QuestionChoice Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS QuestionChoice (
        choiceID TEXT PRIMARY KEY,
        questionID TEXT NOT NULL,
        text TEXT NOT NULL,
        isCorrect INTEGER DEFAULT 0 CHECK(isCorrect IN (0, 1)), -- Boolean
        FOREIGN KEY (questionID) REFERENCES Question(questionID) ON DELETE CASCADE
    )
    ''')

    # QuestionClass Table (Associative Entity)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS QuestionClass (
        questionID TEXT NOT NULL,
        classID TEXT NOT NULL,
        PRIMARY KEY (questionID, classID),
        FOREIGN KEY (questionID) REFERENCES Question(questionID) ON DELETE CASCADE,
        FOREIGN KEY (classID) REFERENCES Class(classID) ON DELETE CASCADE
    )
    ''')

    # QuestionAttempt Table
    # Used for logging each attempt a student makes on a question in case we want to collect stats
    # resourceAwarded can be 'Water', 'Earth', 'Sun', 'None'
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS QuestionAttempt (
        attemptID TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        questionID TEXT NOT NULL,
        isCorrect INTEGER DEFAULT 0 CHECK(isCorrect IN (0, 1)), -- Boolean
        resourceAwarded TEXT CHECK(resourceAwarded IN ('Water', 'Earth', 'Sun', 'None')),
        timestamp TEXT,
        FOREIGN KEY (username) REFERENCES Account(username) ON DELETE CASCADE,
        FOREIGN KEY (questionID) REFERENCES Question(questionID)
    )
    ''')

    # StudentDetails Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS StudentDetails (
        studentUsername TEXT PRIMARY KEY,
        studentLevel INTEGER,
        studentStats TEXT, -- JSON
        parentEmail TEXT,
        FOREIGN KEY (studentUsername) REFERENCES Account(username) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()
    print("Database schema created successfully.")

if __name__ == "__main__":
    create_schema()
