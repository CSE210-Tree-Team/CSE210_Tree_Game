"""Tree management service."""
from typing import Optional, Dict
from database.getItemsFromDatabase import get_tree, get_all_trees
from database.addItemsToDatabase import update_stat, apply_passive_decay


class TreeService:
    """
    Handles tree-related logic including retrieving tree data,
    updating resource stats, and applying passive decay mechanics.
    """
    
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
        update_stat(tree_id, stat_name, value)
    
    @staticmethod
    def apply_decay(tree_id: str) -> None:
        apply_passive_decay(tree_id)
    
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
                apply_passive_decay(tree_id)
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
            apply_passive_decay(tree['treeID'])
            tree = get_tree(username)  # Refresh after decay
        return tree
