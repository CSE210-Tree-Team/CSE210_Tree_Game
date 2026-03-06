"""Email sending utilities."""
from email.message import EmailMessage
import smtplib
from typing import Union
from schemas import Event
from config import settings


class EmailService:
    """
    Service for sending emails and notifications.
    
    This service handles all email-related functionality, including sending
    notifications about tree events to students. Email settings are loaded
    from the application configuration.
    
    Example usage:
    ```python
    from utils.email import EmailService
    from schemas import Event
    
    # Send event notification
    event = Event(
        eventID='evt-123',
        eventType='Bonus',
        resourceAffected='Water',
        description='Rain bonus',
        percentChange=15,
        conditions='Weather event'
    )
    
    success = EmailService.send_event_notification(
        target_email='student@example.com',
        event=event
    )
    
    if success:
        print('Notification sent')
    else:
        print('Failed to send notification')
    ```
    """
    
    @staticmethod
    def send_event_notification(target_email: str, event: Union[dict, Event]) -> bool:
        """
        Send an email notification about a tree event.
        
        This method formats and sends an email to notify a student about
        an event affecting their tree (bonuses, penalties, level changes, etc.).
        
        Args:
            target_email: Email address to send notification to
            event: Event object or dictionary with event data
                Required keys if dict:
                - 'eventType': str ('Bonus', 'Penalty', 'Level', 'Neutral')
                - 'resourceAffected': str ('Water', 'Earth', 'Sun', 'All', 'None')
                - 'description': str (human-readable description)
                - 'percentChange': int (percentage change to resource)
                - 'conditions': str (conditions that triggered the event)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        
        Note:
        - Email credentials are loaded from config.settings
        - Uses SMTP with TLS for secure transmission
        - Logs errors but doesn't raise exceptions
        - TODO: Implement events more in-depth for production use
        """
        # Convert Event object to dict if needed
        event_data = event.__dict__ if isinstance(event, Event) else event
        
        # Format event details
        event_str = (
            f"Event Type: {event_data['eventType']}, "
            f"Resource Affected: {event_data['resourceAffected']}, "
            f"Description: {event_data['description']} "
            f"Stat Changes: {event_data['percentChange']}%, "
            f"Conditions Met: {event_data['conditions']}"
        )
        
        print(f"Preparing to send email to {target_email} with message: {event_str}")
        
        try:
            message = f"Your tree just experienced the following event: {event_str}"
            
            email_msg = EmailMessage()
            email_msg["From"] = settings.EMAIL_SENDER
            email_msg["To"] = target_email
            email_msg["Subject"] = "Tree Event Update"
            email_msg.set_content(message)
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
                server.send_message(email_msg)
            
            print("Email sent successfully!")
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
