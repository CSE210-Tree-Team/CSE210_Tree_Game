"""User management routes."""
from fastapi import APIRouter, Request, Depends, HTTPException
from schemas import UserWithTree, UserInfo, TreeInfo
from api.dependencies import student_required
from services.tree_service import TreeService
from database.getItemsFromDatabase import get_person, get_student_details
from database.addItemsToDatabase import update_account, upsert_student_details

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
            "roles": ["Student"],
            "contactEmail": "parent@example.com",
            "educationLevel": "6-8"
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
    
    # Get student details for contactEmail and educationLevel
    student_details = get_student_details(username) if username else None
    
    # Construct UserInfo object with all user data
    user_info = UserInfo(
        username=student.get("username"),
        email=student.get("email"),
        displayName=student.get("displayName"),
        roles=student.get("roles", []),
        contactEmail=student_details.get("parentEmail") if student_details else None,
        educationLevel=str(student_details.get("studentLevel")) if student_details and student_details.get("studentLevel") else None,
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


@router.put("/update-user", response_model=UserWithTree)
async def update_user(
    user_update: UserInfo,
    request: Request,
    student=Depends(student_required),
):
    """
    Update the current user's information.
    
    Allows users to update their displayName, email, contactEmail, and educationLevel.
    
    Request body:
    {
        "username": "student@example.com",
        "email": "newemail@example.com",
        "displayName": "New Name",
        "roles": ["Student"],
        "contactEmail": "contact@example.com",
        "educationLevel": "6-8"
    }
    
    Returns:
    {
        "success": true,
        "message": "User information updated successfully",
        "user": { ... },
        "tree": { ... }
    }
    
    Note: Requires authentication. Returns 403 if not logged in as a student.
    """
    try:
        username = student.get("username")
        if not username:
            raise HTTPException(status_code=401, detail="No username found in session")
        
        # Verify account exists
        account = get_person(username)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Update account information (displayName and email)
        if user_update.displayName or user_update.email:
            update_account(
                username=username,
                display_name=user_update.displayName,
                email=user_update.email,
            )
        
        # Update student details (contactEmail and educationLevel)
        if user_update.contactEmail or user_update.educationLevel:
            upsert_student_details(
                student_username=username,
                parent_email=user_update.contactEmail,
                education_level=user_update.educationLevel,
            )
        
        # Fetch updated information and tree
        updated_account = get_person(username)
        updated_student_details = get_student_details(username)
        tree = TreeService.get_tree_with_decay(username)
        
        # Construct updated UserInfo
        updated_user_info = UserInfo(
            username=updated_account.get("username"),
            email=updated_account.get("email"),
            displayName=updated_account.get("displayName", ""),
            roles=updated_account.get("roles", []),
            contactEmail=updated_student_details.get("parentEmail") if updated_student_details else None,
            educationLevel=str(updated_student_details.get("studentLevel")) if updated_student_details and updated_student_details.get("studentLevel") else None,
        )
        
        # Construct TreeInfo if tree exists
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
            message="User information updated successfully",
            user=updated_user_info,
            tree=tree_info,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
