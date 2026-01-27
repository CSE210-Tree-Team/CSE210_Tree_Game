import sqlite3
import os

DB_NAME = "game_database.db"

def create_schema():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Foreign key constraints are enforced
    cursor.execute("PRAGMA foreign_keys = ON;")

    print(f"Connected to {DB_NAME}. Creating tables...")

    # Account Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Account (
        accountID TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        displayName TEXT,
        accountReference TEXT,
        dateOfBirth TEXT,
        lastLogin TEXT
    )
    ''')

    # AccountRole Table
    # Constraint: accountID is unique here, effectively making this 1:1 or 1:Many restricted by PK
    # role can only be 'Student' or 'Teacher'
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS AccountRole (
        accountID TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Student', 'Teacher')),
        PRIMARY KEY (accountID, role),
        FOREIGN KEY (accountID) REFERENCES Account(accountID) ON DELETE CASCADE
    )
    ''')

    # Tree Table
    # health can only be 'Dead', 'Withered', 'Unhealthy', 'Healthy'
    # growthStage is an INTEGER representing stages of growth --> currently undefined specification
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Tree (
        treeID TEXT PRIMARY KEY,
        ownerAccountID TEXT NOT NULL,
        health TEXT NOT NULL CHECK(health IN ('Dead', 'Withered', 'Unhealthy', 'Healthy')),
        growthStage INTEGER DEFAULT 0,
        lastUpdated TEXT,
        FOREIGN KEY (ownerAccountID) REFERENCES Account(accountID) ON DELETE CASCADE
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
    # eventType can only be 'Decay', 'Bonus', 'Penalty'
    # resourceAffected can be 'Water', 'Earth', 'Sun', 'None', 'All'
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Event (
        eventID TEXT PRIMARY KEY,
        eventType TEXT NOT NULL CHECK(eventType IN ('Decay', 'Bonus', 'Penalty')),
        resourceAffected TEXT CHECK(resourceAffected IN ('Water', 'Earth', 'Sun', 'None', 'All')),
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
        teacherID TEXT NOT NULL,
        active INTEGER DEFAULT 1 CHECK(active IN (0, 1)), -- Boolean (0 or 1)
        levelPolicy INTEGER DEFAULT 0 CHECK(levelPolicy IN (0, 1)), -- Boolean
        FOREIGN KEY (teacherID) REFERENCES Account(accountID)
    )
    ''')

    # Enrollment Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Enrollment (
        accountID TEXT NOT NULL,
        classID TEXT NOT NULL,
        PRIMARY KEY (accountID, classID),
        FOREIGN KEY (accountID) REFERENCES Account(accountID) ON DELETE CASCADE,
        FOREIGN KEY (classID) REFERENCES Class(classID) ON DELETE CASCADE
    )
    ''')

    # Question Table
    # type can be 'MCQ', 'FreeResponse', 'MultiSelect'
    # resourceType can be 'Water', 'Earth', 'Sun', 'General'  --> General means all resources
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Question (
        questionID TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('MCQ', 'FreeResponse', 'MultiSelect')),
        difficulty INTEGER,
        resourceType TEXT CHECK(resourceType IN ('Water', 'Earth', 'Sun', 'General'))
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
        accountID TEXT NOT NULL,
        questionID TEXT NOT NULL,
        isCorrect INTEGER DEFAULT 0 CHECK(isCorrect IN (0, 1)), -- Boolean
        resourceAwarded TEXT CHECK(resourceAwarded IN ('Water', 'Earth', 'Sun', 'None')),
        timestamp TEXT,
        FOREIGN KEY (accountID) REFERENCES Account(accountID) ON DELETE CASCADE,
        FOREIGN KEY (questionID) REFERENCES Question(questionID)
    )
    ''')

    # StudentDetails Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS StudentDetails (
        studentID TEXT PRIMARY KEY,
        studentLevel INTEGER,
        studentStats TEXT, -- JSON
        parentEmail TEXT,
        FOREIGN KEY (studentID) REFERENCES Account(accountID) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()
    print("Database schema created successfully.")

if __name__ == "__main__":
    create_schema()