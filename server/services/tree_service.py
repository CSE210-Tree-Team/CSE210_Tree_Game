"""Tree management service."""
from typing import Optional, Dict
from database.getItemsFromDatabase import get_tree, get_all_trees, _query
from database.addItemsToDatabase import update_stat, apply_passive_decay
from services.notification_service import NotificationService
from config.settings import settings


class TreeService:
    """
    Handles tree-related logic including retrieving tree data,
    updating resource stats, and applying passive decay mechanics.
    """
    
    @staticmethod
    def _get_tree_resource_snapshot(tree_id: str) -> Optional[Dict]:
        """
        Fetch owner and current resource levels for a tree.

        Returns:
            Dict with ownerUsername/water/earth/sun or None if tree missing.
        """
        return _query(
            """SELECT t.ownerUsername, r.water, r.earth, r.sun
               FROM Tree t
               LEFT JOIN TreeResources r ON t.treeID = r.treeID
               WHERE t.treeID = ?""",
            (tree_id,),
            fetchone=True,
        )

    @staticmethod
    def _notify_resource_changes(tree_id: str, before: Dict, after: Dict) -> None:
        """
        Send threshold notifications for any changed resource levels.
        """
        username = after.get("ownerUsername") or before.get("ownerUsername")
        if not username:
            return

        for resource_name in (settings.RESOURCE_WATER, settings.RESOURCE_EARTH, settings.RESOURCE_SUN):
            old_value = before.get(resource_name) or 0
            new_value = after.get(resource_name) or 0

            if old_value == new_value:
                continue

            try:
                NotificationService.check_and_notify_threshold(
                    username=username,
                    tree_id=tree_id,
                    resource_name=resource_name,
                    old_value=old_value,
                    new_value=new_value,
                )
            except Exception as e:
                print(f"Error checking threshold notification for tree {tree_id} ({resource_name}): {e}")

    @staticmethod
    def get_user_tree(username: str) -> Optional[Dict]:
        """
        Get tree information for a user.
        
        Args:
            username: The username of the tree owner
            
        Returns:
            Dict with tree info or None if not found
            {
                'treeID': str,
                'ownerUsername': str,
                'health': str,  // 'Healthy', 'Unhealthy', 'Withered', 'Dead'
                'growthStage': int,  // 0-5
                'resourceLevels': {
                    'water': int,  // 0-100
                    'earth': int,  // 0-100
                    'sun': int     // 0-100
                },
                'lastUpdated': str  // ISO datetime
            }
        """
        return get_tree(username)
    
    @staticmethod
    def get_tree_id(username: str) -> Optional[str]:
        """
        Get the tree ID for a user.
        """
        tree = get_tree(username)
        return tree['treeID'] if tree else None
    
    @staticmethod
    def update_tree_stat(tree_id: str, stat_name: str, value: int) -> None:
        """
        Update a specific stat for a tree.
        
        This method updates one of the tree's resource levels. The value is added
        to the current level (can be negative to subtract). Resource levels are
        automatically clamped between RESOURCE_MIN_LEVEL and RESOURCE_MAX_LEVEL.
        
        Args:
            tree_id: The tree's UUID
            stat_name: Name of the stat to update ('water', 'earth', or 'sun')
            value: Amount to add/subtract (positive or negative integer)
            
        Raises:
            ValueError: If stat_name is invalid or value is out of acceptable range

        Note: Valid stat_name values are defined in settings.py
        """
        before = TreeService._get_tree_resource_snapshot(tree_id)
        update_stat(tree_id, stat_name, value)
        after = TreeService._get_tree_resource_snapshot(tree_id)

        if before and after:
            TreeService._notify_resource_changes(tree_id, before, after)
    
    @staticmethod
    def apply_decay(tree_id: str) -> None:
        before = TreeService._get_tree_resource_snapshot(tree_id)
        decayed = apply_passive_decay(tree_id)
        after = TreeService._get_tree_resource_snapshot(tree_id)

        if decayed and before and after:
            TreeService._notify_resource_changes(tree_id, before, after)
    
    @staticmethod
    def apply_decay_to_all() -> int:
        """
        Apply passive decay to all trees in the database.
        
        This method is called periodically by the background decay service.
        It iterates through all trees and applies decay based on time elapsed.
        
        Returns:
            int: Number of trees successfully processed
        
        Note: Logs errors for individual trees but continues processing others.
        """
        all_trees = get_all_trees()
        count = 0
        
        for tree_row in all_trees:
            try:
                tree_id = tree_row['treeID']
                TreeService.apply_decay(tree_id)
                count += 1
            except Exception as e:
                print(f"Error applying decay to tree {tree_row.get('treeID')}: {e}")
        
        return count
    
    @staticmethod
    def get_tree_with_decay(username: str) -> Optional[Dict]:
        """
        Get tree information with passive decay applied.
        
        This is the recommended method for retrieving tree data as it ensures
        the resource levels are up-to-date by automatically applying decay
        before returning the data.
        
        Args:
            username: Username of the tree owner
            
        Returns:
            Dict with current tree data (after decay applied), or None if not found
        
        Note: This method calls apply_decay() internally before returning data.
        """
        tree = get_tree(username)
        if tree:
            TreeService.apply_decay(tree['treeID'])
            tree = get_tree(username)  # Refresh after decay
        return tree
