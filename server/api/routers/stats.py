"""Tree stat update routes."""
from fastapi import APIRouter, Request, Depends, HTTPException
from schemas import StatUpdateRequest, StatUpdateResponse
from api.dependencies import student_required
from services.tree_service import TreeService

router = APIRouter(prefix="/api", tags=["stats"])


@router.put("/update-stat", response_model=StatUpdateResponse)
async def update_stat(
    request: Request,
    body: StatUpdateRequest,
    student=Depends(student_required)
):
    """
    Update a specific stat for the student's tree.
    
    This endpoint updates one of the tree's resource levels (water, earth, or sun).
    Used when a student successfully completes a game or answers questions correctly.
    
    Request body:
    {
        "stat_name": "water",   // "water", "earth", or "sun" (case-insensitive)
        "value": 10             // amount to add (positive) or subtract (negative)
    }
    
    Returns:
    {
        "success": true,
        "message": f"{stat_name_lower} updated by {body.value}"
    }
    
    Validation:
    - stat_name must be "water", "earth", or "sun" (case-insensitive)
    - value must be an integer (can be negative)
    - Resource levels are clamped between 0-100 (see settings.py)
    
    Note: This is treated as an event and logged for tracking purposes.
    TODO: Refactor into comprehensive event system.
    """
    # Get user's tree
    username = student.get("username")
    tree_id = TreeService.get_tree_id(username)
    
    if not tree_id:
        raise HTTPException(status_code=404, detail="Tree not found for user")
    
    # Validate stat name and value
    if not body.stat_name:
        raise HTTPException(status_code=400, detail="stat_name is required")
    
    if body.value is None or isinstance(body.value, bool):
        raise HTTPException(status_code=400, detail="value must be an integer")
    
    # Convert stat_name to lowercase for case-insensitive comparison
    stat_name_lower = body.stat_name.lower()
    
    try:
        TreeService.update_tree_stat(tree_id, stat_name_lower, body.value)
        
        return StatUpdateResponse(
            success=True,
            message=f"{stat_name_lower} updated by {body.value}"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update stat: {str(e)}")
