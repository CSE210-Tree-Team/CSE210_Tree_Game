"""
Database Schema Unit Tests

Unit tests for database schema creation and integrity. Tests verify that the database
schema is properly created with correct tables, constraints, and relationships.

Tests are specifically focused on the files: createDatabase.py and generateTestData.py.

Test Classes:
    TestGameDatabaseSystem: Tests for database schema creation and validation.

Test Coverage:
    - Database schema creation
    - Table creation and structure
    - Constraint enforcement
    - Foreign key relationships
"""

import unittest
import sqlite3
import os
from database import createDatabase
from database import generateTestData
from config.settings import settings

class TestGameDatabaseSystem(unittest.TestCase):
    TEST_DB = "test_game_database.db"

    def setUp(self):
        """Set up a fresh database before each test."""
        # Ensure we start with a clean slate
        if os.path.exists(self.TEST_DB):
            os.remove(self.TEST_DB)
            
        # Create the schema
        createDatabase.create_schema(db_path=self.TEST_DB)
        
        # Connect for verification
        self.conn = sqlite3.connect(self.TEST_DB)
        self.cursor = self.conn.cursor()
        self.cursor.execute("PRAGMA foreign_keys = ON;")

    def tearDown(self):
        """Clean up the file after each test."""
        self.conn.close()
        if os.path.exists(self.TEST_DB):
            os.remove(self.TEST_DB)

    ## --- Tests for createDatabase.py ---

    def test_schema_creation(self):
        """Check if all tables exist after create_schema is called."""
        tables = ["Account", "AccountRole", "Tree", "TreeResources", "Question", "QuestionChoice"]
        for table in tables:
            self.cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';")
            self.assertIsNotNone(self.cursor.fetchone(), f"Table {table} should exist.")

    def test_foreign_key_constraints(self):
        """Ensure Foreign Keys prevent orphaned data."""
        # Attempt to insert a Tree for an account that doesn't exist
        with self.assertRaises(sqlite3.IntegrityError):
            self.cursor.execute('''
                INSERT INTO Tree (treeID, ownerUsername, health) 
                VALUES ('tree123', 'non_existent_user', 'Healthy')
            ''')

    def test_check_constraints(self):
        """Ensure CHECK constraints (enums) are working."""
        # Create a valid account first
        self.cursor.execute("INSERT INTO Account (username, email, passwordHash) VALUES ('u', 'e', 'p')")
        
        # Try to insert an invalid role
        with self.assertRaises(sqlite3.IntegrityError):
            self.cursor.execute("INSERT INTO AccountRole (username, role) VALUES ('u', 'Admin')")

    ## --- Tests for generateTestData.py ---

    def test_add_students_creates_full_profile(self):
        """Verify add_students creates Account, Role, StudentDetails, and Tree."""
        generateTestData.add_students(self.conn, self.cursor)
        
        # Check if Adrian was created
        self.cursor.execute("SELECT username FROM Account WHERE username='adrian'")
        self.assertIsNotNone(self.cursor.fetchone())

        # Check if the tree was automatically created
        self.cursor.execute('''
            SELECT T.treeID FROM Tree T 
            JOIN Account A ON T.ownerUsername = A.username 
            WHERE A.username='adrian'
        ''')
        self.assertIsNotNone(self.cursor.fetchone(), "Adrian should have a tree.")

    def test_add_questions_and_choices(self):
        """Verify questions and their corresponding choices are inserted."""
        generateTestData.add_questions(self.conn, self.cursor)

        # Check if the first question exists
        self.cursor.execute("SELECT questionID FROM Question WHERE text='What color is the sun?'")
        q_result = self.cursor.fetchone()
        self.assertIsNotNone(q_result)
        q_id = q_result[0]

        # Check if choices for that question were inserted
        self.cursor.execute("SELECT COUNT(*) FROM QuestionChoice WHERE questionID=?", (q_id,))
        choice_count = self.cursor.fetchone()[0]
        self.assertEqual(choice_count, 3, "The sun question should have 3 choices.")

    def test_tree_initial_resources(self):
        """Verify that create_tree sets resources to 100."""
        
        acc_id = "test_acc"
        self.cursor.execute("INSERT INTO Account (username, email, passwordHash) VALUES (?, 'e', 'p')", (acc_id,))
        tree_id = generateTestData.create_tree(self.conn, self.cursor, acc_id)
        
        self.cursor.execute("SELECT water, earth, sun FROM TreeResources WHERE treeID=?", (tree_id,))
        resources = self.cursor.fetchone()
        self.assertEqual(resources, (100, 100, 100))

if __name__ == "__main__":
    unittest.main()