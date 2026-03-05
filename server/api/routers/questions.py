"""Question management routes."""
from fastapi import APIRouter, Request, Depends, HTTPException
from schemas import (
    QuestionCreate, DataResponse,
    QuestionsGetRequest, QuestionListResponse
)
from api.dependencies import student_required, get_current_user
from services.question_service import QuestionService

router = APIRouter(prefix="/api", tags=["questions"])

@router.post("/add-question", response_model=DataResponse)
async def add_question(
    request: Request,
    body: QuestionCreate,
    person=Depends(get_current_user)
):
    """
    Add a new question to the database.
    
    This endpoint allows adding educational questions to the question bank.
    Questions can be multiple-choice, multi-select, or free-response format.
    
    Request body:
    {
        "text": "What color is the sun?",
        "question_type": "MCQ",              // "MCQ", "MultiSelect", or "FreeResponse"
        "resource_type": "sun",              // "water", "earth", "sun", "general", or "none" (case-insensitive)
        "choices": ["Yellow", "Green", "Blue"],
        "correct_choices": [0],              // List of indices of correct answers
        "check_duplicates": true             // Optional, defaults to true
    }
    
    Returns:
    {
        "success": true,
        "message": "Question added successfully",
        "questionID": "uuid-string"
    }
    
    Note:
    - correct_choices is a list of indices (0-based) in the choices array
    - Multiple correct answers are supported by including multiple indices
    - If check_duplicates is true, will prevent adding identical questions
    """
    try:
        question_id = QuestionService.add_new_question(
            text=body.text,
            question_type=body.question_type,
            resource_type=body.resource_type,
            choices=body.choices,
            correct_choices=body.correct_choices,
            check_duplicates=body.check_duplicates
        )
        
        return DataResponse(
            success=True,
            data={"message": "Question added successfully", "questionID": question_id}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add question: {str(e)}")


@router.post("/get-question", response_model=DataResponse)
async def get_question(
    request: Request,
    body: dict,
    person=Depends(get_current_user)
):
    """
    Retrieve a single question by ID.
    
    This endpoint fetches a specific question's details from the database.
    Used when you need to display or edit a particular question.
    
    Request body:
    {
        "questionID": "uuid-string"
    }
    
    Returns:
    {
        "success": true,
        "question": {
            "questionID": "uuid-string",
            "text": "What color is the sun?",
            "choices": ["Yellow", "Green", "Blue"],
            "correct_choices": [0]  // Indices of correct answers
        }
    }
    
    Returns 404 if question not found.
    """
    question_id = body.get("questionID")
    if not question_id:
        raise HTTPException(status_code=400, detail="questionID is required")
    
    try:
        question = QuestionService.get_question_by_id(question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return DataResponse(success=True, data={"question": question})
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve question: {str(e)}")


@router.post("/get-questions", response_model=QuestionListResponse)
async def get_questions(
    request: Request,
    body: QuestionsGetRequest,
    person=Depends(get_current_user)
):
    """
    Retrieve multiple questions with optional filtering.
    
    This endpoint fetches questions from the database with optional filters.
    Used to populate quiz games with relevant questions.
    
    Request body:
    {
        "numQuestions": 5,              // Optional - max number to return, null for all
        "resourceType": "water",        // Optional - filter by resource type (case-insensitive)
        "questionType": "MCQ",          // Optional - filter by question type
        "difficulty": 1                 // Optional - filter by difficulty level
    }
    
    Returns:
    {
        "success": true,
        "count": 3,
        "questions": [
            {
                "questionID": "uuid",
                "text": "What is H2O?",
                "type": "MCQ",
                "difficulty": 1,
                "resourceType": "water",
                "choices": [
                    {"text": "Water", "isCorrect": true},
                    {"text": "Carbon Dioxide", "isCorrect": false}
                ]
            },
            ...
        ]
    }
    
    Filtering:
    - All filters are optional and can be combined
    - numQuestions limits the result set size
    - If no filters provided, returns all questions
    """
    try:
        questions = QuestionService.get_filtered_questions(
            num_questions=body.numQuestions,
            resource_type=body.resourceType,
            question_type=body.questionType,
            difficulty=body.difficulty
        )
        
        return QuestionListResponse(
            success=True,
            count=len(questions),
            questions=questions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve questions: {str(e)}")
