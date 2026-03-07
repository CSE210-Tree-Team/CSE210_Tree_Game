"""
Notification Service for Tree Health Alerts

This service manages email notifications when tree resources fall below defined thresholds.
It integrates EmailService with tree resource monitoring to alert users about critical tree health.
"""

import uuid
from typing import Optional, Dict
from schemas import Event
from utils.email import EmailService
from config.settings import settings
from database.getItemsFromDatabase import get_student_details, get_tree
from database.addItemsToDatabase import add_event


class NotificationService:
    """
    Handles threshold-based email notifications for tree health alerts.
    
    This service monitors tree resource levels (water, earth) and sends email
    notifications to users when their tree crosses critical health thresholds.
    """
    
    @staticmethod
    def _get_threshold_status(resource_name: str, level: int) -> str:
        """
        Determine the health status based on resource level and thresholds.
        
        Args:
            resource_name: The resource type ('water' or 'earth')
            level: The current resource level (0-100)
            
        Returns:
            str: Health status ('Healthy', 'Unhealthy', or 'Withered')
        """
        if resource_name == settings.RESOURCE_WATER:
            if level >= settings.TREE_HEALTH_THRESHOLD:
                return settings.HEALTH_HEALTHY
            elif level >= settings.TREE_UNHEALTHY_THRESHOLD:
                return settings.HEALTH_UNHEALTHY
            else:
                return settings.HEALTH_WITHERED
        elif resource_name == settings.RESOURCE_EARTH:
            if level >= settings.EARTH_HEALTH_THRESHOLD:
                return settings.HEALTH_HEALTHY
            elif level >= settings.EARTH_UNHEALTHY_THRESHOLD:
                return settings.HEALTH_UNHEALTHY
            else:
                return settings.HEALTH_WITHERED
        else: # Default for sun.
            return settings.HEALTH_HEALTHY
    
    @staticmethod
    def _has_crossed_threshold(old_value: int, new_value: int, resource_name: str) -> Optional[str]:
        """
        Check if a resource level change has crossed a threshold boundary.
        
        Args:
            old_value: Previous resource level
            new_value: New resource level
            resource_name: The resource type ('water', 'earth', 'sun')
            
        Returns:
            str or None: The new threshold status if crossed, None if no threshold crossed
        """
        old_status = NotificationService._get_threshold_status(resource_name, old_value)
        new_status = NotificationService._get_threshold_status(resource_name, new_value)
        
        # Only notify when health deteriorates (not when it improves)
        if old_status != new_status and old_value > new_value:
            return new_status
        
        return None
    
    @staticmethod
    def _get_user_contact_email(username: str) -> Optional[str]:
        """
        Retrieve the contact email for a user.
        
        Args:
            username: The username to look up
            
        Returns:
            str or None: The contact email if set, None otherwise
        """
        student_details = get_student_details(username)
        if student_details:
            return student_details.get('contactEmail')
        return None
    
    @staticmethod
    def _create_threshold_event(resource_name: str, threshold_status: str, new_level: int) -> Event:
        """
        Create an Event object for a threshold crossing notification and store it in the database.
        
        Args:
            resource_name: The resource that crossed a threshold
            threshold_status: The new health status ('Unhealthy' or 'Withered')
            new_level: The current resource level
            
        Returns:
            Event: Event object describing the threshold crossing
            
        Raises:
            Exception: If database insertion fails (logged but not re-raised)
        """
        # Map resource name to proper case
        resource_display = resource_name.capitalize()
        
        # Create descriptive message based on status
        if threshold_status == settings.HEALTH_WITHERED:
            description = f"CRITICAL: Your tree's {resource_display} level has fallen to {new_level}% - it is now {threshold_status}! "
            event_type = settings.EVENT_CHANGE
        elif threshold_status == settings.HEALTH_UNHEALTHY:
            description = f"WARNING: Your tree's {resource_display} level has fallen to {new_level}% - it is becoming {threshold_status}. "
            event_type = settings.EVENT_CHANGE
        else:
            # This should not be reached in normal operation, but serves as a defensive fallback
            description = f"An error occurred while processing the threshold event. Contact the Bristlecone team for support. "
            event_type = settings.EVENT_CHANGE
        
        event = Event(
            eventID=str(uuid.uuid4()),
            eventType=event_type,
            resourceAffected=resource_display,
            description=description,
            percentChange=0,  # Just describing absolute threshold
            conditions=f"{resource_display} level fell below threshold into {threshold_status} status"
        )
        
        # Store event in database
        try:
            add_event(event)
        except Exception as e:
            # Log but don't fail notification if database insertion fails
            print(f"Warning: Failed to store threshold event in database: {e}")
        
        return event
    
    @staticmethod
    def check_and_notify_threshold(username: str, tree_id: str, resource_name: str, 
                                   old_value: int, new_value: int) -> bool:
        """
        Check if a threshold was crossed and send notification email if needed.
        
        This is the main entry point for threshold-based notifications. It should be
        called after any resource update to check if a notification is warranted.
        
        Args:
            username: The owner of the tree
            tree_id: The tree ID being monitored
            resource_name: The resource that was updated ('water', 'earth', 'sun')
            old_value: The previous resource level
            new_value: The new resource level
            
        Returns:
            bool: True if notification was sent, False otherwise
        """
        # Check if we crossed a threshold
        threshold_status = NotificationService._has_crossed_threshold(
            old_value, new_value, resource_name
        )
        
        if not threshold_status:
            return False  # No threshold crossed
        
        # Get user's contact email
        contact_email = NotificationService._get_user_contact_email(username)
        
        if not contact_email:
            print(f"No contact email found for user {username} - skipping notification")
            return False
        
        # Create event for the threshold crossing
        event = NotificationService._create_threshold_event(
            resource_name, threshold_status, new_value
        )
        
        # Send notification
        try:
            success = EmailService.send_event_notification(contact_email, event)
            if success:
                print(f"Threshold notification sent to {username} ({contact_email}) for {resource_name} -> {threshold_status}")
            return success
        except Exception as e:
            print(f"Error sending threshold notification to {username}: {e}")
            return False
