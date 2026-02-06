"""Unit tests for tree resource updates and passive decay.

This module contains unit tests for updating tree resources and the passive decay system.

Test classes:
    TestUpdateStat: Tests for the update_stat() function.
    TestPassiveDecay: Tests for the apply_passive_decay() function.
"""

import sqlite3
import os
import sys
import tempfile
import shutil
import unittest
from datetime import datetime, timedelta

# Add parent directory to path to import constants and other modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the modules to test
from Database.createDatabase import create_schema
from Database.addItemsToDatabase import (
    add_account, generate_tree, update_stat, apply_passive_decay
)
from Database.getItemsFromDatabase import get_tree

from constants import (
    DB_NAME, ROLE_STUDENT, RESOURCE_MAX_LEVEL, RESOURCE_MIN_LEVEL, PASSIVE_DECAY_RATE
)


class UpdateStatsTestCase(unittest.TestCase):
    """Base test case that sets up a temporary database for each test."""
    
    def setUp(self):
        """Set up a fresh database before each test."""
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, DB_NAME)
        
        # Patch the database path in all imported modules
        import Database.addItemsToDatabase as addItemsToDatabase
        import Database.getItemsFromDatabase as getItemsFromDatabase
        import Database.createDatabase as createDatabase
        
        addItemsToDatabase.DB_PATH = self.db_path
        getItemsFromDatabase.DB_PATH = self.db_path
        createDatabase.DB_PATH = self.db_path
        
        # Create schema for this test
        create_schema(self.db_path)
    
    def tearDown(self):
        """Clean up the temporary directory after each test."""
        shutil.rmtree(self.test_dir)
    
    def create_test_tree(self, username="test_user@example.com"):
        """Helper method to create a test student account with a tree."""
        add_account(
            username=username,
            email=username,
            passwordHash="test_hash",
            displayName="Test User",
            accountReference="test_ref",
            dateOfBirth="2000-01-01",
            role=ROLE_STUDENT
        )
        tree_id = generate_tree(username)
        return tree_id, username


class TestUpdateStat(UpdateStatsTestCase):
    """Tests for the update_stat function."""
    
    def test_update_water_positive(self):
        """Test increasing water resource."""
        tree_id, username = self.create_test_tree()
        
        # First reduce water to make room for increase
        update_stat(tree_id, 'water', -20)
        
        # Get state after reduction
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Update water by +10
        update_stat(tree_id, 'water', 10)
        
        # Verify update
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water + 10)
    
    def test_update_water_negative(self):
        """Test decreasing water resource."""
        tree_id, username = self.create_test_tree()
        
        # Get initial state
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Update water by -20
        update_stat(tree_id, 'water', -20)
        
        # Verify update
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water - 20)
    
    def test_update_earth_positive(self):
        """Test increasing earth resource."""
        tree_id, username = self.create_test_tree()
        
        # First reduce earth to make room for increase
        update_stat(tree_id, 'earth', -30)
        
        # Get state after reduction
        tree = get_tree(username)
        initial_earth = tree['resourceLevels']['earth']
        
        # Update earth by +15
        update_stat(tree_id, 'earth', 15)
        
        # Verify update
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['earth'], initial_earth + 15)
    
    def test_update_sun_positive(self):
        """Test increasing sun resource."""
        tree_id, username = self.create_test_tree()
        
        # First reduce sun to make room for increase
        update_stat(tree_id, 'sun', -40)
        
        # Get state after reduction
        tree = get_tree(username)
        initial_sun = tree['resourceLevels']['sun']
        
        # Update sun by +25
        update_stat(tree_id, 'sun', 25)
        
        # Verify update
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['sun'], initial_sun + 25)
    
    def test_update_clamped_at_max(self):
        """Test that resources are clamped at RESOURCE_MAX_LEVEL."""
        tree_id, username = self.create_test_tree()
        
        # Try to increase water beyond max
        update_stat(tree_id, 'water', 500)
        
        # Verify it's clamped at max
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], RESOURCE_MAX_LEVEL)
    
    def test_update_clamped_at_min(self):
        """Test that resources are clamped at RESOURCE_MIN_LEVEL."""
        tree_id, username = self.create_test_tree()
        
        # Try to decrease water below min
        update_stat(tree_id, 'water', -500)
        
        # Verify it's clamped at min
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], RESOURCE_MIN_LEVEL)
    
    def test_update_multiple_resources(self):
        """Test updating multiple resources sequentially."""
        tree_id, username = self.create_test_tree()
        
        # Get initial state
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        initial_earth = tree['resourceLevels']['earth']
        initial_sun = tree['resourceLevels']['sun']
        
        # Update all three resources
        update_stat(tree_id, 'water', -10)
        update_stat(tree_id, 'earth', -15)
        update_stat(tree_id, 'sun', -5)
        
        # Verify all updates
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water - 10)
        self.assertEqual(tree['resourceLevels']['earth'], initial_earth - 15)
        self.assertEqual(tree['resourceLevels']['sun'], initial_sun - 5)
    
    def test_update_invalid_stat_name(self):
        """Test that invalid stat names raise ValueError."""
        tree_id, username = self.create_test_tree()
        
        with self.assertRaises(ValueError) as context:
            update_stat(tree_id, 'invalid_stat', 10)
        
        self.assertIn("Invalid stat name", str(context.exception))
    
    def test_update_stat_updates_lastUpdated(self):
        """Test that update_stat updates the lastUpdated timestamp."""
        tree_id, username = self.create_test_tree()
        
        # Get initial lastUpdated
        tree = get_tree(username)
        initial_last_updated = tree['lastUpdated']
        
        # Wait a tiny bit to ensure timestamp difference
        import time
        time.sleep(0.01)
        
        # Update a stat
        update_stat(tree_id, 'water', 5)
        
        # Verify lastUpdated changed
        tree = get_tree(username)
        self.assertNotEqual(tree['lastUpdated'], initial_last_updated)
        self.assertGreater(tree['lastUpdated'], initial_last_updated)
    
    def test_update_zero_value(self):
        """Test updating with zero value."""
        tree_id, username = self.create_test_tree()
        
        # Get initial state
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Update water by 0
        update_stat(tree_id, 'water', 0)
        
        # Verify no change
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water)


class TestPassiveDecay(UpdateStatsTestCase):
    """Tests for the apply_passive_decay function."""
    
    def test_decay_no_time_elapsed(self):
        """Test that no decay occurs when insufficient time has elapsed."""
        tree_id, username = self.create_test_tree()
        
        # Get initial resources
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        initial_earth = tree['resourceLevels']['earth']
        initial_sun = tree['resourceLevels']['sun']
        
        # Apply decay immediately (no time elapsed)
        result = apply_passive_decay(tree_id)
        
        # Verify no decay occurred
        self.assertFalse(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water)
        self.assertEqual(tree['resourceLevels']['earth'], initial_earth)
        self.assertEqual(tree['resourceLevels']['sun'], initial_sun)
    
    def test_decay_with_elapsed_time(self):
        """Test that decay occurs when sufficient time has elapsed."""
        tree_id, username = self.create_test_tree()
        
        # Get initial resources
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        initial_earth = tree['resourceLevels']['earth']
        initial_sun = tree['resourceLevels']['sun']
        
        # Set lastUpdated to 2 hours ago (120 minutes)
        two_hours_ago = (datetime.now() - timedelta(hours=2)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (two_hours_ago, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Calculate expected decay: 120 minutes / PASSIVE_DECAY_RATE
        expected_decay = int(120 // PASSIVE_DECAY_RATE)
        
        # Verify decay occurred
        self.assertTrue(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], max(initial_water - expected_decay, RESOURCE_MIN_LEVEL))
        self.assertEqual(tree['resourceLevels']['earth'], max(initial_earth - expected_decay, RESOURCE_MIN_LEVEL))
        self.assertEqual(tree['resourceLevels']['sun'], max(initial_sun - expected_decay, RESOURCE_MIN_LEVEL))
    
    def test_decay_updates_lastUpdated(self):
        """Test that successful decay updates the lastUpdated timestamp."""
        tree_id, username = self.create_test_tree()
        
        # Set lastUpdated to 1 hour ago
        one_hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (one_hour_ago, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Verify lastUpdated was updated
        if result:  # Only if decay actually occurred
            tree = get_tree(username)
            self.assertGreater(tree['lastUpdated'], one_hour_ago)
    
    def test_decay_exact_rate(self):
        """Test decay with exactly PASSIVE_DECAY_RATE minutes elapsed."""
        tree_id, username = self.create_test_tree()
        
        # Get initial resources
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Set lastUpdated to exactly PASSIVE_DECAY_RATE minutes ago
        past_time = (datetime.now() - timedelta(minutes=PASSIVE_DECAY_RATE)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (past_time, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Should decay exactly 1 level
        self.assertTrue(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water - 1)
    
    def test_decay_less_than_rate(self):
        """Test that no decay occurs when elapsed time is less than PASSIVE_DECAY_RATE."""
        tree_id, username = self.create_test_tree()
        
        # Get initial resources
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Set lastUpdated to less than PASSIVE_DECAY_RATE minutes ago
        past_time = (datetime.now() - timedelta(minutes=PASSIVE_DECAY_RATE - 5)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (past_time, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Should not decay
        self.assertFalse(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water)
    
    def test_decay_clamped_at_zero(self):
        """Test that decay doesn't take resources below RESOURCE_MIN_LEVEL."""
        tree_id, username = self.create_test_tree()
        
        # Set resources to low values
        update_stat(tree_id, 'water', -95)  # Set to 5
        update_stat(tree_id, 'earth', -95)
        update_stat(tree_id, 'sun', -95)
        
        # Set lastUpdated to 10 hours ago (should decay more than 5 levels)
        ten_hours_ago = (datetime.now() - timedelta(hours=10)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (ten_hours_ago, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Verify resources are clamped at minimum
        self.assertTrue(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], RESOURCE_MIN_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], RESOURCE_MIN_LEVEL)
        self.assertEqual(tree['resourceLevels']['sun'], RESOURCE_MIN_LEVEL)
    
    def test_decay_all_resources_at_zero(self):
        """Test decay behavior when all resources are already at zero."""
        tree_id, username = self.create_test_tree()
        
        # Set all resources to zero
        update_stat(tree_id, 'water', -100)
        update_stat(tree_id, 'earth', -100)
        update_stat(tree_id, 'sun', -100)
        
        # Get the lastUpdated after setting to zero
        tree = get_tree(username)
        last_updated_after_zero = tree['lastUpdated']
        
        # Set lastUpdated to 2 hours ago
        two_hours_ago = (datetime.now() - timedelta(hours=2)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (two_hours_ago, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Resources are already at minimum, so no actual change occurred
        # However, update_stat is still called which updates lastUpdated
        # So result should be False since resources didn't actually change
        self.assertFalse(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], RESOURCE_MIN_LEVEL)
        self.assertEqual(tree['resourceLevels']['earth'], RESOURCE_MIN_LEVEL)
        self.assertEqual(tree['resourceLevels']['sun'], RESOURCE_MIN_LEVEL)
    
    def test_decay_multiple_periods(self):
        """Test decay over multiple PASSIVE_DECAY_RATE periods."""
        tree_id, username = self.create_test_tree()
        
        # Get initial resources
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Set lastUpdated to 3 * PASSIVE_DECAY_RATE minutes ago
        past_time = (datetime.now() - timedelta(minutes=3 * PASSIVE_DECAY_RATE)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (past_time, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Should decay exactly 3 levels
        self.assertTrue(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water - 3)
    
    def test_decay_invalid_tree_id(self):
        """Test decay with non-existent tree ID."""
        # Try to decay a non-existent tree
        result = apply_passive_decay("nonexistent-tree-id")
        
        # Should return False
        self.assertFalse(result)
    
    def test_decay_partial_period(self):
        """Test that partial decay periods are truncated (not rounded)."""
        tree_id, username = self.create_test_tree()
        
        # Get initial resources
        tree = get_tree(username)
        initial_water = tree['resourceLevels']['water']
        
        # Set lastUpdated to 1.5 * PASSIVE_DECAY_RATE minutes ago
        past_time = (datetime.now() - timedelta(minutes=1.5 * PASSIVE_DECAY_RATE)).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", 
                          (past_time, tree_id))
            conn.commit()
        
        # Apply decay
        result = apply_passive_decay(tree_id)
        
        # Should decay 1 level (truncated, not rounded to 2)
        self.assertTrue(result)
        tree = get_tree(username)
        self.assertEqual(tree['resourceLevels']['water'], initial_water - 1)


if __name__ == '__main__':
    unittest.main()
