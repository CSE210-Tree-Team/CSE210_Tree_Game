"""Unit tests for the NotificationService."""

import unittest
from unittest.mock import patch, MagicMock
from services.notification_service import NotificationService
from schemas import Event
from config.settings import settings


class TestNotificationService(unittest.TestCase):
    """Test cases for NotificationService threshold checking and notifications."""
    
    def test_get_threshold_status_water_healthy(self):
        """Test water resource at healthy level."""
        status = NotificationService._get_threshold_status('water', 75)
        self.assertEqual(status, settings.HEALTH_HEALTHY)
    
    def test_get_threshold_status_water_unhealthy(self):
        """Test water resource at unhealthy level."""
        status = NotificationService._get_threshold_status('water', 50)
        self.assertEqual(status, settings.HEALTH_UNHEALTHY)
    
    def test_get_threshold_status_water_withered(self):
        """Test water resource at withered level."""
        status = NotificationService._get_threshold_status('water', 30)
        self.assertEqual(status, settings.HEALTH_WITHERED)
    
    def test_get_threshold_status_water_at_threshold(self):
        """Test water resource exactly at threshold boundary."""
        # At 70, should be healthy (>= TREE_HEALTH_THRESHOLD)
        status = NotificationService._get_threshold_status('water', 70)
        self.assertEqual(status, settings.HEALTH_HEALTHY)
        
        # At 69, should be unhealthy (< TREE_HEALTH_THRESHOLD)
        status = NotificationService._get_threshold_status('water', 69)
        self.assertEqual(status, settings.HEALTH_UNHEALTHY)
        
        # At 40, should be unhealthy (>= TREE_UNHEALTHY_THRESHOLD)
        status = NotificationService._get_threshold_status('water', 40)
        self.assertEqual(status, settings.HEALTH_UNHEALTHY)
        
        # At 39, should be withered (< TREE_UNHEALTHY_THRESHOLD)
        status = NotificationService._get_threshold_status('water', 39)
        self.assertEqual(status, settings.HEALTH_WITHERED)
    
    def test_get_threshold_status_earth_healthy(self):
        """Test earth resource at healthy level."""
        status = NotificationService._get_threshold_status('earth', 80)
        self.assertEqual(status, settings.HEALTH_HEALTHY)
    
    def test_get_threshold_status_earth_unhealthy(self):
        """Test earth resource at unhealthy level."""
        status = NotificationService._get_threshold_status('earth', 50)
        self.assertEqual(status, settings.HEALTH_UNHEALTHY)
    
    def test_get_threshold_status_earth_withered(self):
        """Test earth resource at withered level."""
        status = NotificationService._get_threshold_status('earth', 30)
        self.assertEqual(status, settings.HEALTH_WITHERED)
    
    def test_get_threshold_status_earth_at_threshold(self):
        """Test earth resource exactly at threshold boundary."""
        # At 75, should be healthy (>= EARTH_HEALTH_THRESHOLD)
        status = NotificationService._get_threshold_status('earth', 75)
        self.assertEqual(status, settings.HEALTH_HEALTHY)
        
        # At 74, should be unhealthy (< EARTH_HEALTH_THRESHOLD)
        status = NotificationService._get_threshold_status('earth', 74)
        self.assertEqual(status, settings.HEALTH_UNHEALTHY)
        
        # At 45, should be unhealthy (>= EARTH_UNHEALTHY_THRESHOLD)
        status = NotificationService._get_threshold_status('earth', 45)
        self.assertEqual(status, settings.HEALTH_UNHEALTHY)
        
        # At 44, should be withered (< EARTH_UNHEALTHY_THRESHOLD)
        status = NotificationService._get_threshold_status('earth', 44)
        self.assertEqual(status, settings.HEALTH_WITHERED)
    
    def test_has_crossed_threshold_no_crossing(self):
        """Test when no threshold is crossed."""
        # No crossing when staying in same status
        result = NotificationService._has_crossed_threshold(80, 75, 'water')
        self.assertIsNone(result)
        
        # No crossing when improving
        result = NotificationService._has_crossed_threshold(30, 50, 'water')
        self.assertIsNone(result)
    
    def test_has_crossed_threshold_healthy_to_unhealthy(self):
        """Test crossing from healthy to unhealthy."""
        result = NotificationService._has_crossed_threshold(75, 65, 'water')
        self.assertEqual(result, settings.HEALTH_UNHEALTHY)
    
    def test_has_crossed_threshold_unhealthy_to_withered(self):
        """Test crossing from unhealthy to withered."""
        result = NotificationService._has_crossed_threshold(50, 35, 'water')
        self.assertEqual(result, settings.HEALTH_WITHERED)
    
    def test_has_crossed_threshold_healthy_to_withered(self):
        """Test crossing from healthy directly to withered."""
        result = NotificationService._has_crossed_threshold(80, 30, 'water')
        self.assertEqual(result, settings.HEALTH_WITHERED)
    
    def test_has_crossed_threshold_improvement_ignored(self):
        """Test that improvements don't trigger notifications."""
        # Withered to unhealthy (improvement)
        result = NotificationService._has_crossed_threshold(30, 50, 'water')
        self.assertIsNone(result)
        
        # Unhealthy to healthy (improvement)
        result = NotificationService._has_crossed_threshold(60, 75, 'water')
        self.assertIsNone(result)
    
    @patch('services.notification_service.get_student_details')
    def test_get_user_contact_email_success(self, mock_get_student):
        """Test retrieving contact email successfully."""
        mock_get_student.return_value = {
            'studentUsername': 'testuser',
            'contactEmail': 'test@example.com'
        }
        
        email = NotificationService._get_user_contact_email('testuser')
        self.assertEqual(email, 'test@example.com')
        mock_get_student.assert_called_once_with('testuser')
    
    @patch('services.notification_service.get_student_details')
    def test_get_user_contact_email_no_email(self, mock_get_student):
        """Test when user has no contact email set."""
        mock_get_student.return_value = {
            'studentUsername': 'testuser',
            'contactEmail': None
        }
        
        email = NotificationService._get_user_contact_email('testuser')
        self.assertIsNone(email)
    
    @patch('services.notification_service.get_student_details')
    def test_get_user_contact_email_no_student_details(self, mock_get_student):
        """Test when user has no student details."""
        mock_get_student.return_value = None
        
        email = NotificationService._get_user_contact_email('testuser')
        self.assertIsNone(email)
    
    @patch('services.notification_service.add_event')
    def test_create_threshold_event_withered(self, mock_add_event):
        """Test creating event for withered status."""
        event = NotificationService._create_threshold_event('water', settings.HEALTH_WITHERED, 30)
        
        self.assertIsInstance(event, Event)
        self.assertEqual(event.eventType, settings.EVENT_CHANGE)
        self.assertEqual(event.resourceAffected, 'Water')
        self.assertIn('CRITICAL', event.description)
        self.assertIn('Withered', event.description)
        self.assertIn('30%', event.description)
        
        # Verify event was added to database
        mock_add_event.assert_called_once_with(event)
    
    @patch('services.notification_service.add_event')
    def test_create_threshold_event_unhealthy(self, mock_add_event):
        """Test creating event for unhealthy status."""
        event = NotificationService._create_threshold_event('earth', settings.HEALTH_UNHEALTHY, 50)
        
        self.assertIsInstance(event, Event)
        self.assertEqual(event.eventType, settings.EVENT_CHANGE)
        self.assertEqual(event.resourceAffected, 'Earth')
        self.assertIn('WARNING', event.description)
        self.assertIn('Unhealthy', event.description)
        self.assertIn('50%', event.description)
        
        # Verify event was added to database
        mock_add_event.assert_called_once_with(event)
    
    @patch('services.notification_service.add_event')
    def test_create_threshold_event_unique_ids(self, mock_add_event):
        """Test that multiple events generate unique eventIDs."""
        event1 = NotificationService._create_threshold_event('water', settings.HEALTH_WITHERED, 30)
        event2 = NotificationService._create_threshold_event('water', settings.HEALTH_WITHERED, 30)
        event3 = NotificationService._create_threshold_event('earth', settings.HEALTH_UNHEALTHY, 50)
        
        # All eventIDs should be unique (required for PRIMARY KEY in database)
        self.assertNotEqual(event1.eventID, event2.eventID)
        self.assertNotEqual(event1.eventID, event3.eventID)
        self.assertNotEqual(event2.eventID, event3.eventID)
        
        # Verify they are valid UUIDs
        import uuid
        try:
            uuid.UUID(event1.eventID)
            uuid.UUID(event2.eventID)
            uuid.UUID(event3.eventID)
        except ValueError:
            self.fail("eventID should be a valid UUID")
    
    @patch('services.notification_service.add_event')
    def test_create_threshold_event_database_failure(self, mock_add_event):
        """Test that event creation continues even if database insertion fails."""
        mock_add_event.side_effect = Exception("Database error")
        
        # Should not raise exception, just log warning
        event = NotificationService._create_threshold_event('water', settings.HEALTH_WITHERED, 30)
        
        # Event should still be created
        self.assertIsInstance(event, Event)
        self.assertEqual(event.eventType, settings.EVENT_CHANGE)
        
        # add_event should have been attempted
        mock_add_event.assert_called_once()
    
    @patch('services.notification_service.add_event')
    @patch('services.notification_service.EmailService.send_event_notification')
    @patch('services.notification_service.get_student_details')
    def test_check_and_notify_threshold_success(self, mock_get_student, mock_send_email, mock_add_event):
        """Test successful threshold notification."""
        mock_get_student.return_value = {
            'contactEmail': 'test@example.com'
        }
        mock_send_email.return_value = True
        
        # Crossing from healthy to unhealthy
        result = NotificationService.check_and_notify_threshold(
            username='testuser',
            tree_id='tree-123',
            resource_name='water',
            old_value=75,
            new_value=65
        )
        
        self.assertTrue(result)
        mock_send_email.assert_called_once()
        
        # Verify event details
        call_args = mock_send_email.call_args
        sent_email = call_args[0][0]
        sent_event = call_args[0][1]
        
        self.assertEqual(sent_email, 'test@example.com')
        self.assertIsInstance(sent_event, Event)
        self.assertEqual(sent_event.resourceAffected, 'Water')
    
    @patch('services.notification_service.get_student_details')
    def test_check_and_notify_threshold_no_threshold_crossed(self, mock_get_student):
        """Test when no threshold is crossed."""
        result = NotificationService.check_and_notify_threshold(
            username='testuser',
            tree_id='tree-123',
            resource_name='water',
            old_value=75,
            new_value=73
        )
        
        self.assertFalse(result)
        # Should not even check for email
        mock_get_student.assert_not_called()
    
    @patch('services.notification_service.add_event')
    @patch('services.notification_service.get_student_details')
    def test_check_and_notify_threshold_no_contact_email(self, mock_get_student, mock_add_event):
        """Test when user has no contact email."""
        mock_get_student.return_value = None
        
        result = NotificationService.check_and_notify_threshold(
            username='testuser',
            tree_id='tree-123',
            resource_name='water',
            old_value=75,
            new_value=65
        )
        
        self.assertFalse(result)
    
    @patch('services.notification_service.add_event')
    @patch('services.notification_service.EmailService.send_event_notification')
    @patch('services.notification_service.get_student_details')
    def test_check_and_notify_threshold_email_failure(self, mock_get_student, mock_send_email, mock_add_event):
        """Test when email sending fails."""
        mock_get_student.return_value = {
            'contactEmail': 'test@example.com'
        }
        mock_send_email.return_value = False
        
        result = NotificationService.check_and_notify_threshold(
            username='testuser',
            tree_id='tree-123',
            resource_name='water',
            old_value=75,
            new_value=65
        )
        
        self.assertFalse(result)
    
    @patch('services.notification_service.add_event')
    @patch('services.notification_service.EmailService.send_event_notification')
    @patch('services.notification_service.get_student_details')
    def test_check_and_notify_threshold_exception_handling(self, mock_get_student, mock_send_email, mock_add_event):
        """Test exception handling during notification."""
        mock_get_student.return_value = {
            'contactEmail': 'test@example.com'
        }
        mock_send_email.side_effect = Exception("SMTP error")
        
        # Should not raise exception, just log and return False
        result = NotificationService.check_and_notify_threshold(
            username='testuser',
            tree_id='tree-123',
            resource_name='water',
            old_value=75,
            new_value=65
        )
        
        self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()
