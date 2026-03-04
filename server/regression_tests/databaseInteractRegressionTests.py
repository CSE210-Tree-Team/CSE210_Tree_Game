"""
Database Interaction Unit Tests

Comprehensive unit tests for the Database module's addItemsToDatabase and getItemsFromDatabase
modules. Tests cover account management, question creation, tree generation, resource management,
event handling, and database integration scenarios.

Tests are specifically focused on the files: addItemsToDatabase.py and getItemsFromDatabase.py.

Test Classes:
    DatabaseInteractTestCase: Base test class with database setup/teardown.
    TestAddAccount: Account creation and validation.
    TestAddRole: Role management and assignment.
    TestQuestion: Question and choice creation.
    TestTreeAndResources: Tree generation and resource manipulation.
    TestEvents: Event processing and resource effects.
    TestAccountUpdate: Account information updates.
    TestLastLogin: Login timestamp tracking.
    TestStudentDetails: Student-specific details.
    TestIntegration: Full workflow integration tests.

Total Unit Tests: 30
Coverage: Accounts, roles, questions, trees, resources, events, updates, and data retrieval.

Total Integration Tests: 1 
Coverage: End-to-end account creation, tree generation, event application, and data verification.

Note: 
    Created this file with the help of Gemini to ensure comprehensive test coverage. Reviewed and edited by Adrian.
"""

import sqlite3
import os
import sys
import tempfile
import shutil
import unittest
from datetime import datetime
import uuid

# Add parent directory to path to import constants and other modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the modules to test using absolute imports
from database.createDatabase import create_schema
from database.addItemsToDatabase import (
    add_account, add_role, add_question_alone, add_question_choice,
    update_stat, update_health, update_account, update_last_login,
    generate_tree, do_event, join_class, add_student_details
)
from database.getItemsFromDatabase import get_person, get_tree

from config.settings import settings
from schemas import Event


class DatabaseInteractTestCase(unittest.TestCase):
    """Base test case that sets up a temporary database for each test."""
    
    def setUp(self):
        """Set up a fresh database before each test."""
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, settings.DB_NAME)
        
        # Patch the database path in all imported modules
        import database.addItemsToDatabase as addItemsToDatabase
        import database.getItemsFromDatabase as getItemsFromDatabase
        import database.createDatabase as createDatabase
        
        addItemsToDatabase.DB_PATH = self.db_path
        getItemsFromDatabase.DB_PATH = self.db_path
        createDatabase.DB_PATH = self.db_path
        
        # Create schema for this test
        create_schema(self.db_path)
    
    def tearDown(self):
        """Clean up the temporary directory after each test."""
        shutil.rmtree(self.test_dir)


class TestAddAccount(DatabaseInteractTestCase):
    """Test account creation and role management."""
    
    def test_add_account_student(self):
        """Test adding a student account."""
        username = add_account(
            username="student1",
            email="student1@example.com",
            passwordHash="hashed_password_123",
            displayName="Student One",
            accountReference="ref_001",
            dateOfBirth="2010-05-15",
            role=settings.ROLE_STUDENT
        )
        
        self.assertEqual(username, "student1")
        person = get_person("student1")
        self.assertIsNotNone(person)
        self.assertEqual(person['email'], "student1@example.com")
        self.assertEqual(person['displayName'], "Student One")
        self.assertIn(settings.ROLE_STUDENT, person['roles'])
        self.assertNotIn('passwordHash', person)  # Should be removed
    
    def test_add_account_teacher(self):
        """Test adding a teacher account."""
        username = add_account(
            username="teacher1",
            email="teacher1@example.com",
            passwordHash="hashed_password_456",
            displayName="Teacher One",
            accountReference="ref_002",
            dateOfBirth="1985-03-20",
            role=settings.ROLE_TEACHER
        )
        
        self.assertEqual(username, "teacher1")
        person = get_person("teacher1")
        self.assertIsNotNone(person)
        self.assertIn(settings.ROLE_TEACHER, person['roles'])
    
    def test_add_account_invalid_role(self):
        """Test adding account with invalid role raises ValueError."""
        with self.assertRaises(ValueError):
            add_account(
                username="invalid_user",
                email="invalid@example.com",
                passwordHash="hashed_password",
                displayName="Invalid User",
                accountReference="ref_invalid",
                dateOfBirth="2000-01-01",
                role="InvalidRole"
            )
    
    def test_add_account_missing_required_field(self):
        """Test adding account with missing required fields."""
        with self.assertRaises(ValueError):
            add_account(
                username="",  # Empty username
                email="test@example.com",
                passwordHash="hash",
                displayName="Test",
                accountReference="ref",
                dateOfBirth="2000-01-01",
                role=settings.ROLE_STUDENT
            )
    
    def test_add_account_duplicate_username(self):
        """Test that duplicate usernames raise an error."""
        add_account(
            username="duplicate_user",
            email="user1@example.com",
            passwordHash="hash1",
            displayName="User 1",
            accountReference="ref1",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
        
        # Try to add another account with same username
        with self.assertRaises(sqlite3.IntegrityError):
            add_account(
                username="duplicate_user",
                email="user2@example.com",
                passwordHash="hash2",
                displayName="User 2",
                accountReference="ref2",
                dateOfBirth="2000-01-01",
                role=settings.ROLE_STUDENT
            )


class TestAddRole(DatabaseInteractTestCase):
    """Test role management."""
    
    def test_add_role_to_student(self):
        """Test adding teacher role to existing student account."""
        add_account(
            username="dual_role_user",
            email="dual@example.com",
            passwordHash="hash",
            displayName="Dual Role",
            accountReference="ref",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
        
        # Add teacher role
        add_role("dual_role_user", settings.ROLE_TEACHER)
        
        person = get_person("dual_role_user")
        self.assertIn(settings.ROLE_STUDENT, person['roles'])
        self.assertIn(settings.ROLE_TEACHER, person['roles'])
    
    def test_add_invalid_role(self):
        """Test adding invalid role raises ValueError."""
        add_account(
            username="user",
            email="user@example.com",
            passwordHash="hash",
            displayName="User",
            accountReference="ref",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
        
        with self.assertRaises(ValueError):
            add_role("user", "InvalidRole")


class TestQuestion(DatabaseInteractTestCase):
    """Test question creation and management."""
    
    def test_add_mcq_question(self):
        """Test adding a multiple choice question."""
        question_id = add_question_alone(
            question_id="q1",
            text="What is 2+2?",
            question_type=settings.QUESTION_MCQ,
            difficulty=1,
            resource_type=settings.QUESTION_RESOURCE_GENERAL
        )
        
        self.assertEqual(question_id, "q1")
    
    def test_add_question_with_choices(self):
        """Test adding a question with choices."""
        question_id = add_question_alone(
            question_id="q_math",
            text="What is 2+2?",
            question_type=settings.QUESTION_MCQ,
            difficulty=1,
            resource_type=settings.QUESTION_RESOURCE_WATER
        )
        
        add_question_choice("choice1", question_id, "3", is_correct=False)
        add_question_choice("choice2", question_id, "4", is_correct=True)
        add_question_choice("choice3", question_id, "5", is_correct=False)
        
        # Verify by querying the database
        import sqlite3
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM QuestionChoice WHERE questionID = ?", (question_id,))
            choices = [dict(row) for row in cursor.fetchall()]
            
            self.assertEqual(len(choices), 3)
            correct_choices = [c for c in choices if c['isCorrect'] == 1]
            self.assertEqual(len(correct_choices), 1)
            self.assertEqual(correct_choices[0]['text'], "4")
    
    def test_add_question_invalid_type(self):
        """Test adding question with invalid type raises ValueError."""
        with self.assertRaises(ValueError):
            add_question_alone(
                question_id="q_invalid",
                text="Test question",
                question_type="InvalidType",
                difficulty=1
            )
    
    def test_add_question_invalid_resource_type(self):
        """Test adding question with invalid resource type."""
        with self.assertRaises(ValueError):
            add_question_alone(
                question_id="q_invalid",
                text="Test question",
                question_type=settings.QUESTION_MCQ,
                resource_type="InvalidResource"
            )


class TestTreeAndResources(DatabaseInteractTestCase):
    """Test tree creation and resource management."""
    
    def setUp(self):
        """Set up test with a user account and tree."""
        super().setUp()
        
        add_account(
            username="tree_owner",
            email="owner@example.com",
            passwordHash="hash",
            displayName="Tree Owner",
            accountReference="ref",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
    
    def test_generate_tree(self):
        """Test generating a new tree for a user."""
        tree_id = generate_tree("tree_owner")
        
        self.assertIsNotNone(tree_id)
        
        tree = get_tree("tree_owner")
        self.assertIsNotNone(tree)
        self.assertEqual(tree['treeID'], tree_id)
        self.assertEqual(tree['ownerUsername'], "tree_owner")
        self.assertEqual(tree['health'], settings.HEALTH_HEALTHY)
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['sun'], settings.RESOURCE_MAX_LEVEL)
    
    def test_update_water_resource(self):
        """Test updating water resource."""
        tree_id = generate_tree("tree_owner")
        
        update_stat(tree_id, "water", 50)
        
        tree = get_tree("tree_owner")
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
    
    def test_update_resource_negative(self):
        """Test subtracting from resources."""
        tree_id = generate_tree("tree_owner")
        
        update_stat(tree_id, "water", -30)
        
        tree = get_tree("tree_owner")
        self.assertEqual(tree['resourceLevels']['water'], 70)
    
    def test_update_resource_clamps_to_zero(self):
        """Test that resources don't go below minimum level."""
        tree_id = generate_tree("tree_owner")
        
        # Try to subtract more than available
        update_stat(tree_id, "water", -200)
        
        tree = get_tree("tree_owner")
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MIN_LEVEL)
    
    def test_update_resource_clamps_to_max(self):
        """Test that resources don't exceed maximum level."""
        tree_id = generate_tree("tree_owner")
        
        # Try to add more than the maximum
        update_stat(tree_id, "water", 500)
        
        tree = get_tree("tree_owner")
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
    
    def test_update_all_resources(self):
        """Test updating multiple resources."""
        tree_id = generate_tree("tree_owner")
        
        update_stat(tree_id, "water", 25)
        update_stat(tree_id, "earth", -50)
        update_stat(tree_id, "sun", 75)
        
        tree = get_tree("tree_owner")
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], 50)
        self.assertEqual(tree['resourceLevels']['sun'], settings.RESOURCE_MAX_LEVEL)
    
    def test_update_resource_invalid_stat(self):
        """Test updating invalid stat name raises ValueError."""
        tree_id = generate_tree("tree_owner")
        
        with self.assertRaises(ValueError):
            update_stat(tree_id, "invalid_stat", 10)
    
    def test_update_health_to_withered(self):
        """Test updating tree health status."""
        tree_id = generate_tree("tree_owner")
        
        update_health(tree_id, settings.HEALTH_WITHERED)
        
        tree = get_tree("tree_owner")
        self.assertEqual(tree['health'], settings.HEALTH_WITHERED)
    
    def test_update_health_invalid_status(self):
        """Test updating to invalid health status raises ValueError."""
        tree_id = generate_tree("tree_owner")
        
        with self.assertRaises(ValueError):
            update_health(tree_id, "SuperHealthy")


class TestEvents(DatabaseInteractTestCase):
    """Test event handling."""
    
    def setUp(self):
        """Set up test with a user and tree."""
        super().setUp()
        
        add_account(
            username="event_user",
            email="user@example.com",
            passwordHash="hash",
            displayName="Event User",
            accountReference="ref",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
        
        self.tree_id = generate_tree("event_user")
    
    def test_do_event_bonus_single_resource(self):
        """Test applying a bonus event to a single resource."""
        event = Event(
            eventID="event1",
            eventType="Bonus",
            resourceAffected=settings.RESOURCE_WATER,
            description="Water bonus",
            percentChange=10,
            conditions=None
        )
        
        do_event(self.tree_id, event, 50)
        
        tree = get_tree("event_user")
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], settings.RESOURCE_MAX_LEVEL)  # Unchanged
    
    def test_do_event_penalty_single_resource(self):
        """Test applying a penalty event."""
        event = Event(
            eventID="event2",
            eventType="Penalty",
            resourceAffected=settings.RESOURCE_EARTH,
            description="Earth penalty",
            percentChange=-10,
            conditions=None
        )
        
        do_event(self.tree_id, event, 30)
        
        tree = get_tree("event_user")
        self.assertEqual(tree['resourceLevels']['earth'], 70)
    
    def test_do_event_bonus_all_resources(self):
        """Test applying a bonus to all resources."""
        event = Event(
            eventID="event3",
            eventType="Bonus",
            resourceAffected=settings.RESOURCE_ALL,
            description="All resources bonus",
            percentChange=10,
            conditions=None
        )
        
        do_event(self.tree_id, event, 25)
        
        tree = get_tree("event_user")
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['sun'], settings.RESOURCE_MAX_LEVEL)
    
    def test_do_event_none_resource(self):
        """Test event with no resource affected doesn't change anything."""
        original_water = get_tree("event_user")['resourceLevels']['water']
        
        event = Event(
            eventID="event4",
            eventType="Bonus",
            resourceAffected=settings.RESOURCE_NONE,
            description="No resource event",
            percentChange=10,
            conditions=None
        )
        
        do_event(self.tree_id, event, 100)
        
        tree = get_tree("event_user")
        self.assertEqual(tree['resourceLevels']['water'], original_water)


class TestAccountUpdate(DatabaseInteractTestCase):
    """Test account update functionality."""
    
    def setUp(self):
        """Set up test with a user account."""
        super().setUp()
        
        add_account(
            username="update_user",
            email="original@example.com",
            passwordHash="hash",
            displayName="Original Name",
            accountReference="ref",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
    
    def test_update_display_name(self):
        """Test updating display name."""
        update_account("update_user", display_name="New Name")
        
        person = get_person("update_user")
        self.assertEqual(person['displayName'], "New Name")
        self.assertEqual(person['email'], "original@example.com")  # Unchanged
    
    def test_update_email(self):
        """Test updating email."""
        update_account("update_user", email="newemail@example.com")
        
        person = get_person("update_user")
        self.assertEqual(person['email'], "newemail@example.com")
        self.assertEqual(person['displayName'], "Original Name")  # Unchanged
    
    def test_update_both_fields(self):
        """Test updating both display name and email."""
        update_account(
            "update_user",
            display_name="Updated Name",
            email="updated@example.com"
        )
        
        person = get_person("update_user")
        self.assertEqual(person['displayName'], "Updated Name")
        self.assertEqual(person['email'], "updated@example.com")
    
    def test_update_no_changes(self):
        """Test calling update with no changes."""
        original_person = get_person("update_user")
        
        update_account("update_user")  # No parameters
        
        updated_person = get_person("update_user")
        self.assertEqual(original_person['displayName'], updated_person['displayName'])
        self.assertEqual(original_person['email'], updated_person['email'])


class TestLastLogin(DatabaseInteractTestCase):
    """Test last login tracking."""
    
    def setUp(self):
        """Set up test with a user account."""
        super().setUp()
        
        add_account(
            username="login_user",
            email="login@example.com",
            passwordHash="hash",
            displayName="Login User",
            accountReference="ref",
            dateOfBirth="2000-01-01",
            role=settings.ROLE_STUDENT
        )
    
    def test_update_last_login(self):
        """Test updating last login timestamp."""
        person_before = get_person("login_user")
        self.assertIsNone(person_before['lastLogin'])
        
        update_last_login("login_user")
        
        person_after = get_person("login_user")
        self.assertIsNotNone(person_after['lastLogin'])
        
        # Verify it's a valid ISO format timestamp
        try:
            datetime.fromisoformat(person_after['lastLogin'])
        except ValueError:
            self.fail("lastLogin is not a valid ISO format timestamp")


class TestStudentDetails(DatabaseInteractTestCase):
    """Test student-specific details."""
    
    def setUp(self):
        """Set up test with a student account."""
        super().setUp()
        
        add_account(
            username="student_detail_user",
            email="student@example.com",
            passwordHash="hash",
            displayName="Student",
            accountReference="ref",
            dateOfBirth="2010-05-15",
            role=settings.ROLE_STUDENT
        )
    
    def test_add_student_details(self):
        """Test adding student-specific details."""
        student_stats = '{"questions_answered": 10, "accuracy": 0.85}'
        
        add_student_details(
            student_username="student_detail_user",
            student_level="3-6",
            student_stats=student_stats,
            parent_email="parent@example.com"
        )
        
        # Verify by querying database directly
        import sqlite3
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM StudentDetails WHERE studentUsername = ?",
                ("student_detail_user",)
            )
            result = dict(cursor.fetchone())
            
            self.assertEqual(result['studentLevel'], 1)
            self.assertEqual(result['studentStats'], student_stats)
            self.assertEqual(result['parentEmail'], "parent@example.com")


class TestIntegration(DatabaseInteractTestCase):
    """Integration tests combining multiple operations."""
    
    def test_full_student_workflow(self):
        """Test a complete student workflow."""
        # Create student account
        add_account(
            username="john_student",
            email="john@example.com",
            passwordHash="secure_hash",
            displayName="John Doe",
            accountReference="jd_001",
            dateOfBirth="2010-03-15",
            role=settings.ROLE_STUDENT
        )
        
        # Add student details
        add_student_details("john_student", student_level="3-6")
        
        # Generate tree
        tree_id = generate_tree("john_student")
        
        # Update tree resources through an event
        event = Event(
            eventID="integration_event",
            eventType=settings.EVENT_BONUS,
            resourceAffected=settings.RESOURCE_ALL,
            description="Starting bonus",
            percentChange=50,
            conditions=None
        )
        do_event(tree_id, event, 50)
        
        # Update last login
        update_last_login("john_student")
        
        # Verify final state
        person = get_person("john_student")
        self.assertIsNotNone(person)
        self.assertIn(settings.ROLE_STUDENT, person['roles'])
        self.assertIsNotNone(person['lastLogin'])
        
        # The do_event function should enforce this.
        tree = get_tree("john_student")
        self.assertIsNotNone(tree)
        self.assertEqual(tree['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], settings.RESOURCE_MAX_LEVEL)
        self.assertEqual(tree['resourceLevels']['sun'], settings.RESOURCE_MAX_LEVEL)

        # Tree Decays 10 of each resource:
        do_event(tree['treeID'], Event(
            eventID="decay_event",
            eventType=settings.EVENT_PENALTY,
            resourceAffected=settings.RESOURCE_ALL,
            description="Decay event",
            percentChange=10,
            conditions=None
        ), 10)

        tree_after_decay = get_tree("john_student")
        self.assertEqual(tree_after_decay['resourceLevels']['water'], settings.RESOURCE_MAX_LEVEL - 10)
        self.assertEqual(tree_after_decay['resourceLevels']['earth'], settings.RESOURCE_MAX_LEVEL - 10)
        self.assertEqual(tree_after_decay['resourceLevels']['sun'], settings.RESOURCE_MAX_LEVEL - 10)


if __name__ == '__main__':
    unittest.main()
