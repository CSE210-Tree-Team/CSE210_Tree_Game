"""Unit tests for tree service.

This module contains isolated unit tests for TreeService,
with all external dependencies mocked.
"""

import unittest
from unittest.mock import patch
from config.settings import settings
from services.tree_service import TreeService


class TestTreeService(unittest.TestCase):
    """Tests for TreeService."""

    @patch("services.tree_service.get_tree")
    def test_get_user_tree_returns_tree(self, mock_get_tree):
        """Test get_user_tree returns tree data from data layer."""
        mock_get_tree.return_value = {
            "treeID": "tree-uuid-123",
            "ownerUsername": "student@example.com",
            "health": settings.HEALTH_HEALTHY
        }

        tree = TreeService.get_user_tree("student@example.com")

        self.assertEqual(tree["treeID"], "tree-uuid-123")
        self.assertEqual(tree["health"], settings.HEALTH_HEALTHY)
        mock_get_tree.assert_called_once_with("student@example.com")

    @patch("services.tree_service.get_tree")
    def test_get_tree_id_returns_id_when_tree_exists(self, mock_get_tree):
        """Test get_tree_id returns treeID for existing tree."""
        mock_get_tree.return_value = {"treeID": "tree-uuid-abc"}

        tree_id = TreeService.get_tree_id("student@example.com")

        self.assertEqual(tree_id, "tree-uuid-abc")

    @patch("services.tree_service.get_tree")
    def test_get_tree_id_returns_none_when_missing(self, mock_get_tree):
        """Test get_tree_id returns None when user has no tree."""
        mock_get_tree.return_value = None

        tree_id = TreeService.get_tree_id("student@example.com")

        self.assertIsNone(tree_id)

    @patch("services.tree_service.update_stat")
    def test_update_tree_stat_calls_update_stat(self, mock_update_stat):
        """Test update_tree_stat delegates with expected arguments."""
        TreeService.update_tree_stat("tree-uuid-123", settings.RESOURCE_WATER, 10)

        mock_update_stat.assert_called_once_with("tree-uuid-123", settings.RESOURCE_WATER, 10)

    @patch("services.tree_service.apply_passive_decay")
    def test_apply_decay_calls_apply_passive_decay(self, mock_apply_decay):
        """Test apply_decay delegates to passive decay function."""
        TreeService.apply_decay("tree-uuid-123")

        mock_apply_decay.assert_called_once_with("tree-uuid-123")

    @patch("services.tree_service.NotificationService.check_and_notify_threshold")
    @patch("services.tree_service.apply_passive_decay")
    @patch("services.tree_service._query")
    def test_apply_decay_triggers_threshold_check_on_passive_change(
        self,
        mock_query,
        mock_apply_decay,
        mock_check_threshold,
    ):
        """Test passive decay triggers notification checks when resource levels change."""
        mock_apply_decay.return_value = True
        mock_query.side_effect = [
            {
                "ownerUsername": "student@example.com",
                settings.RESOURCE_WATER: 80,
                settings.RESOURCE_EARTH: 70,
                settings.RESOURCE_SUN: 60,
            },
            {
                "ownerUsername": "student@example.com",
                settings.RESOURCE_WATER: 75,
                settings.RESOURCE_EARTH: 70,
                settings.RESOURCE_SUN: 55,
            },
        ]

        TreeService.apply_decay("tree-uuid-123")

        self.assertEqual(mock_check_threshold.call_count, 2)
        mock_check_threshold.assert_any_call(
            username="student@example.com",
            tree_id="tree-uuid-123",
            resource_name=settings.RESOURCE_WATER,
            old_value=80,
            new_value=75,
        )
        mock_check_threshold.assert_any_call(
            username="student@example.com",
            tree_id="tree-uuid-123",
            resource_name=settings.RESOURCE_SUN,
            old_value=60,
            new_value=55,
        )

    @patch("services.tree_service.apply_passive_decay")
    @patch("services.tree_service.get_all_trees")
    def test_apply_decay_to_all_counts_successes(self, mock_get_all_trees, mock_apply_decay):
        """Test apply_decay_to_all returns processed tree count."""
        mock_get_all_trees.return_value = [
            {"treeID": "tree-1"},
            {"treeID": "tree-2"},
            {"treeID": "tree-3"}
        ]

        count = TreeService.apply_decay_to_all()

        self.assertEqual(count, 3)
        self.assertEqual(mock_apply_decay.call_count, 3)

    @patch("services.tree_service.apply_passive_decay")
    @patch("services.tree_service.get_all_trees")
    def test_apply_decay_to_all_continues_on_failure(self, mock_get_all_trees, mock_apply_decay):
        """Test apply_decay_to_all skips failed trees and continues."""
        mock_get_all_trees.return_value = [
            {"treeID": "tree-1"},
            {"treeID": "tree-2"},
            {"treeID": "tree-3"}
        ]

        def side_effect(tree_id):
            if tree_id == "tree-2":
                raise Exception("decay failed")

        mock_apply_decay.side_effect = side_effect

        count = TreeService.apply_decay_to_all()

        self.assertEqual(count, 2)

    @patch("services.tree_service.apply_passive_decay")
    @patch("services.tree_service.get_tree")
    def test_get_tree_with_decay_applies_and_refreshes(self, mock_get_tree, mock_apply_decay):
        """Test get_tree_with_decay applies decay then reloads tree."""
        initial_tree = {
            "treeID": "tree-uuid-123",
            "resourceLevels": {settings.RESOURCE_WATER: 80}
        }
        refreshed_tree = {
            "treeID": "tree-uuid-123",
            "resourceLevels": {settings.RESOURCE_WATER: 79}
        }
        mock_get_tree.side_effect = [initial_tree, refreshed_tree]

        tree = TreeService.get_tree_with_decay("student@example.com")

        self.assertEqual(tree, refreshed_tree)
        mock_apply_decay.assert_called_once_with("tree-uuid-123")
        self.assertEqual(mock_get_tree.call_count, 2)

    @patch("services.tree_service.apply_passive_decay")
    @patch("services.tree_service.get_tree")
    def test_get_tree_with_decay_returns_none_when_no_tree(self, mock_get_tree, mock_apply_decay):
        """Test get_tree_with_decay returns None without applying decay when tree missing."""
        mock_get_tree.return_value = None

        tree = TreeService.get_tree_with_decay("student@example.com")

        self.assertIsNone(tree)
        mock_apply_decay.assert_not_called()
        mock_get_tree.assert_called_once_with("student@example.com")


if __name__ == "__main__":
    unittest.main()
