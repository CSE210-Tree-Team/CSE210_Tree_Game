"""User management routes."""
from fastapi import APIRouter, Request, Depends
from schemas import UserWithTree, UserInfo, TreeInfo
from api.dependencies import student_required
from services.tree_service import TreeService

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/get-user-info", response_model=UserWithTree)
def get_user_info(request: Request, student=Depends(student_required)):
    """
    Get user information and tree stats with passive decay applied.
    
    This endpoint returns the currently logged-in user's information along with
    their tree's current state. Passive decay is automatically applied before
    returning the data to ensure the tree stats are up-to-date.
    
    Returns:
    {
        "success": true,
        "user": {
            "username": "student@example.com",
            "displayName": "John Doe",
            "email": "student@example.com",
            "roles": ["Student"]
        },
        "tree": {
            "treeID": "uuid-string",
            "health": "Healthy",
            "growthStage": 2,
            "resourceLevels": {
                "water": 75,
                "earth": 80,
                "sun": 65
            }
        }
    }
    
    Note: Requires authentication. Returns 403 if not logged in as a student.
    """
    username = student.get("username")
    
    # Get tree with decay applied
    tree = TreeService.get_tree_with_decay(username) if username else None
    
    # Construct UserInfo object
    user_info = UserInfo(
        username=student.get("username"),
        email=student.get("email"),
        displayName=student.get("displayName"),
        roles=student.get("roles", [])
    )
    
    # Construct TreeInfo object if tree exists
    tree_info = None
    if tree:
        tree_info = TreeInfo(
            treeID=tree.get('treeID'),
            health=tree.get('health'),
            growthStage=tree.get('growthStage'),
            resourceLevels=tree.get('resourceLevels')
        )
    
    return UserWithTree(
        success=True,
        user=user_info,
        tree=tree_info
    )


@router.post("/update-user")
async def update_user(request: Request, account=Depends(student_required)):
    """
    Update user information.
    
    This endpoint will allow users to update their profile information
    such as display name, email preferences, etc.
    
    Request body (planned):
    {
        "displayName": "New Name",
        "email/parent_email": "newemail@example.com"
    }
    
    Returns (planned):
    {
        "success": true,
        "message": "User information updated successfully"
    }
    
    TODO: Implement user update logic.
    """
    return {"message": "Not implemented yet"}
