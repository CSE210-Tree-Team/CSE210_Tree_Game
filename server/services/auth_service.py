"""Authentication and authorization service."""
from typing import Optional, Dict
from database.getItemsFromDatabase import get_person
from database.addItemsToDatabase import add_account, generate_tree, update_last_login, upsert_student_details
from config.settings import settings


class AuthService:
    """
    Handles authentication and user account management including user verification,
    account creation, and role checking.
    """
    
    @staticmethod
    def is_student(username: str) -> bool:
        """
        Check if the user with the given username is a Student.
        
        Args:
            username: The username to check (typically email or Auth0 sub)
            
        Returns:
            bool: True if user exists and has Student role, False otherwise
        """
        person = get_person(username)
        return person is not None and settings.ROLE_STUDENT in person.get('roles', [])
    
    @staticmethod
    def get_user(username: str) -> Optional[Dict]:
        """
        Get user information by username.
        
        Args:
            username: The username to look up
            
        Returns:
            Dict with user info or None if not found
            {
                'username': str,
                'email': str,
                'displayName': str,
                'roles': [str],
                'dateOfBirth': str,
                'lastLogin': str
            }
        """
        return get_person(username)
    
    @staticmethod
    def create_account(username: str, user_data: dict) -> tuple[str, str]:
        """
        Create a new student account with an associated tree.
        
        This method creates a new user account in the database and automatically
        generates a tree for the student. Used during the Auth0 authentication flow
        when a new user logs in for the first time.
        
        Args:
            username: Unique username (typically email or Auth0 sub)
            user_data: Dictionary with user information from Auth0
                {
                    'email': str,
                    'name': str (optional),
                    'nickname': str (optional),
                    'sub': str (Auth0 unique ID),
                    'contactEmail': str (optional)
                }
            
        Returns:
            tuple: (username, tree_id)
                - username: The created username
                - tree_id: UUID of the generated tree
            
        Raises:
            Exception: If account creation fails (database error, etc.)
        
        Note: Defaults to Student role and uses 'auth0' as passwordHash for Auth0 users.
        """
        try:
            # Create account
            add_account(
                username=username,
                email=user_data.get("email", ""),
                passwordHash="auth0",  # Not used for Auth0 users
                displayName=user_data.get("name", user_data.get("nickname", "Student")),
                accountReference=user_data.get("nickname", user_data.get("email", "user")),
                dateOfBirth="2000-01-01",  # Default date
                role=settings.ROLE_STUDENT
            )
            
            # Generate tree for the user
            tree_id = generate_tree(username)
            
            # Create student details with initial email if available.
            contact_email = user_data.get("email")
            if contact_email:
                upsert_student_details(
                    student_username=username,
                    contact_email=contact_email,
                    education_level=None
                )
            
            print(f"Created new account for {username} with tree ID {tree_id}")
            return username, tree_id
            
        except Exception as e:
            print(f"Error creating account: {e}")
            raise
    
    @staticmethod
    def update_login(username: str) -> None:
        update_last_login(username)
