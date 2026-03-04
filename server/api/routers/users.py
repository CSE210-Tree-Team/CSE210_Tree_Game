"""User management routes."""
from fastapi import APIRouter, Request, Depends, HTTPException
from schemas import UserWithTree, UserInfo, TreeInfo, AccountProfile, AccountProfileResponse
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


@router.get("/account/profile", response_model=AccountProfileResponse)
def get_account_profile(request: Request, student=Depends(student_required)):
    """
    Get the current user's account profile.
    
    Returns the user's profile information including name, email, parent email,
    and education level.
    
    Returns:
    {
        "success": true,
        "profile": {
            "name": "John Doe",
            "email": "student@example.com",
            "parentEmail": "parent@example.com",
            "educationLevel": "6-8"
        }
    }
    
    Note: Requires authentication. Returns 403 if not logged in as a student.
    """
    try:
        username = student.get("username")
        if not username:
            raise HTTPException(status_code=401, detail="No username found in session")
        
        # Get account information
        account = get_person(username)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Get student details
        student_details = get_student_details(username)
        
        # Build the profile response
        profile = AccountProfile(
            name=account.get("displayName", ""),
            email=account.get("email", ""),
            parentEmail=student_details.get("parentEmail") if student_details else None,
            educationLevel=str(student_details.get("studentLevel")) if student_details and student_details.get("studentLevel") else None,
        )
        
        return AccountProfileResponse(
            success=True,
            profile=profile,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/account/profile", response_model=AccountProfileResponse)
async def update_account_profile(
    profile_update: AccountProfile,
    request: Request,
    student=Depends(student_required),
):
    """
    Update the current user's account profile.
    
    Allows users to update their name, email, parent email, and education level.
    
    Request body:
    {
        "name": "New Name",
        "email": "newemail@example.com",
        "parentEmail": "parent@example.com",
        "educationLevel": "6-8"
    }
    
    Returns:
    {
        "success": true,
        "message": "Profile updated successfully",
        "profile": { ... }
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
        
        # Update account information (name and email)
        if profile_update.name or profile_update.email:
            update_account(
                username=username,
                display_name=profile_update.name,
                email=profile_update.email,
            )
        
        # Update student details (parent email and education level)
        if profile_update.parentEmail or profile_update.educationLevel:
            upsert_student_details(
                student_username=username,
                parent_email=profile_update.parentEmail,
                education_level=profile_update.educationLevel,
            )
        
        # Fetch updated profile to return
        updated_account = get_person(username)
        updated_student_details = get_student_details(username)
        
        updated_profile = AccountProfile(
            name=updated_account.get("displayName", ""),
            email=updated_account.get("email", ""),
            parentEmail=updated_student_details.get("parentEmail") if updated_student_details else None,
            educationLevel=str(updated_student_details.get("studentLevel")) if updated_student_details and updated_student_details.get("studentLevel") else None,
        )
        
        return AccountProfileResponse(
            success=True,
            profile=updated_profile,
            message="Profile updated successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
