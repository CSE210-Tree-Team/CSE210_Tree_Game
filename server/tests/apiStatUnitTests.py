"""API route tests for stat-related endpoints in main.py.

This module contains unit tests for FastAPI endpoints related to user information
and authentication, specifically /api/update-stat, followed by /api/get-user-info to verify stat updates.

Test classes:
    TestStatAPIRoutes: Tests for stat-related API endpoints.
"""

import os
import sys

# Add parent directory to path to import constants and other modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the test base class
from apiQuestionsUnitTests import APIQuestionsTestCase
from fastapi.testclient import TestClient

# Import the modules to test
from Database.getItemsFromDatabase import get_person
from constants import ROLE_STUDENT, RESOURCE_MAX_LEVEL, RESOURCE_MIN_LEVEL, PASSIVE_DECAY_RATE
from datetime import datetime, timedelta
import time


class TestStatAPIRoutes(APIQuestionsTestCase):
    """Tests for stat-related API routes."""
    
    def test_get_user_info(self):
        """Test the /api/get-user-info endpoint."""
        client = self.get_authenticated_client()
        
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("user", data)
        self.assertIn("tree", data)
        
        # Check user structure
        user = data["user"]
        self.assertIn("username", user)
        self.assertIn("displayName", user)
        self.assertIn("email", user)
        self.assertIn("roles", user)
        
        # Check tree structure
        tree = data["tree"]
        self.assertIn("treeID", tree)
        self.assertIn("health", tree)
        self.assertIn("growthStage", tree)
        self.assertIn("resourceLevels", tree)
        
        self.assertIn("water", tree["resourceLevels"])
        self.assertIn("earth", tree["resourceLevels"])
        self.assertIn("sun", tree["resourceLevels"])

    def test_updating_each_stat(self):
        """Test updating each stat and verifying with /api/get-user-info."""
        client = self.get_authenticated_client()
        
        # Update water stat
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": -10})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verify water stat updated
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree = data["tree"]
        self.assertEqual(tree["resourceLevels"]["water"], RESOURCE_MAX_LEVEL - 10)
        
        # Update earth stat
        response = client.post("/api/update-stat", json={"stat_name": "earth", "value": -10})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verify earth stat updated
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree = data["tree"]
        self.assertEqual(tree["resourceLevels"]["earth"], RESOURCE_MAX_LEVEL - 10)
        
        # Update sun stat
        response = client.post("/api/update-stat", json={"stat_name": "sun", "value": -10})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verify sun stat updated
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree = data["tree"]
        self.assertEqual(tree["resourceLevels"]["sun"], RESOURCE_MAX_LEVEL - 10)

    def test_updating_stat_below_zero(self):
        """Test that updating a stat below zero does not allow negative values."""
        client = self.get_authenticated_client()
        
        # Update water stat to a negative value
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": -200})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verify water stat does not go below zero
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree = data["tree"]
        self.assertEqual(tree["resourceLevels"]["water"], RESOURCE_MIN_LEVEL)

    def test_updating_stat_above_max(self):
        """Test that updating a stat above max does not allow values above 100."""
        client = self.get_authenticated_client()
        
        # Update sun stat to a value above 100
        response = client.post("/api/update-stat", json={"stat_name": "sun", "value": 200})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verify sun stat does not go above 100
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree = data["tree"]
        self.assertEqual(tree["resourceLevels"]["sun"], RESOURCE_MAX_LEVEL)

    def test_updating_invalid_stat(self):
        """Test that updating an invalid stat returns an error."""
        client = self.get_authenticated_client()
        
        # Attempt to update an invalid stat
        response = client.post("/api/update-stat", json={"stat_name": "invalid_stat", "value": 10})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid stat name", data['detail'])

    def test_updating_stat_with_non_integer_value(self):
        """Test that updating a stat with a non-integer value returns an error."""
        client = self.get_authenticated_client()
        
        # Test with string value
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": "not_an_integer"})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("value must be an integer", data['detail'])
        
        # Test with float value
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": 10.5})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("value must be an integer", data['detail'])
        
        # Test with null value
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": None})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("value is required", data['detail'])

    def test_last_updated_changes_after_stat_update(self):
        """Test that lastUpdated timestamp is updated when a stat is modified."""
        client = self.get_authenticated_client()
        
        # Get tree ID and initial lastUpdated from database
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree_id = data["tree"]["treeID"]
        
        # Query database directly for lastUpdated
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT lastUpdated FROM Tree WHERE treeID = ?", (tree_id,))
        initial_last_updated = cursor.fetchone()[0]
        conn.close()
        
        self.assertIsNotNone(initial_last_updated)
        
        # Wait a brief moment to ensure timestamp will be different
        time.sleep(0.1)
        
        # Update a stat
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": -5})
        self.assertEqual(response.status_code, 200)
        
        # Query database again for updated lastUpdated
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT lastUpdated FROM Tree WHERE treeID = ?", (tree_id,))
        updated_last_updated = cursor.fetchone()[0]
        conn.close()
        
        # Verify lastUpdated has changed
        self.assertIsNotNone(updated_last_updated)
        self.assertNotEqual(initial_last_updated, updated_last_updated)
        
        # Verify the new timestamp is more recent
        initial_dt = datetime.fromisoformat(initial_last_updated)
        updated_dt = datetime.fromisoformat(updated_last_updated)
        self.assertGreater(updated_dt, initial_dt)

    def test_last_updated_unchanged_when_no_stat_change(self):
        """Test that lastUpdated does NOT change when stat value doesn't actually change."""
        client = self.get_authenticated_client()
        
        # Get initial tree state
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree_id = data["tree"]["treeID"]
        initial_water = data["tree"]["resourceLevels"]["water"]
        
        # Verify water starts at max
        self.assertEqual(initial_water, RESOURCE_MAX_LEVEL)
        
        # Query database for initial lastUpdated
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT lastUpdated FROM Tree WHERE treeID = ?", (tree_id,))
        initial_last_updated = cursor.fetchone()[0]
        conn.close()
        
        # Wait a brief moment
        time.sleep(0.1)
        
        # Try to update water beyond max (value won't actually change)
        response = client.post("/api/update-stat", json={"stat_name": "water", "value": 10})
        self.assertEqual(response.status_code, 200)
        
        # Get updated tree state to check water level
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        updated_water = data["tree"]["resourceLevels"]["water"]
        
        # Verify water is still at max (properly clamped)
        self.assertEqual(updated_water, RESOURCE_MAX_LEVEL)
        
        # Query database for updated lastUpdated
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT lastUpdated FROM Tree WHERE treeID = ?", (tree_id,))
        updated_last_updated = cursor.fetchone()[0]
        conn.close()
        
        # lastUpdated should NOT change when value doesn't actually change
        self.assertEqual(initial_last_updated, updated_last_updated)

    def test_updating_stat_before_decay_threshold(self):
        """Test updating a stat right before passive decay would occur."""
        client = self.get_authenticated_client()
        
        # Get initial tree state and manipulate lastUpdated to be just before decay
        from Database.addItemsToDatabase import update_stat
        from Database.getItemsFromDatabase import get_tree
        import sqlite3
        
        # Get tree ID
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tree_id = data["tree"]["treeID"]
        
        # Manually set lastUpdated to be 29 minutes ago (just before the 30-minute decay threshold)
        time_before_decay = datetime.now() - timedelta(minutes=PASSIVE_DECAY_RATE - 1)
        time_str = time_before_decay.isoformat()
        
        # Update the database directly
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE Tree SET lastUpdated = ? WHERE treeID = ?", (time_str, tree_id))
        conn.commit()
        conn.close()
        
        # Get tree state - should NOT have decay applied yet
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        water_before_update = data["tree"]["resourceLevels"]["water"]
        
        # Update a stat
        response = client.post("/api/update-stat", json={"stat_name": "earth", "value": -5})
        self.assertEqual(response.status_code, 200)
        
        # Get updated tree state
        response = client.get("/api/get-user-info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify earth was updated correctly and water did NOT decay
        # (because we updated before the decay threshold)
        self.assertEqual(data["tree"]["resourceLevels"]["earth"], RESOURCE_MAX_LEVEL - 5)
        self.assertEqual(data["tree"]["resourceLevels"]["water"], water_before_update)
        
        # Query database to verify lastUpdated is now very recent (within last few seconds)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT lastUpdated FROM Tree WHERE treeID = ?", (tree_id,))
        last_updated_str = cursor.fetchone()[0]
        conn.close()
        
        last_updated = datetime.fromisoformat(last_updated_str)
        now = datetime.now()
        time_diff = abs((now - last_updated).total_seconds())
        self.assertLess(time_diff, 5)  # Should be updated within last 5 seconds

if __name__ == '__main__':
    unittest.main()
