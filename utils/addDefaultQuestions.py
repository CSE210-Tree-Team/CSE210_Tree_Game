"""
Add Default Questions to Database

This script reads questions from questions.json and adds them to the database
directly using the database functions. It uses the duplicate detection feature 
to avoid adding the same question multiple times.
"""

import json
import os
import sys

SERVER_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'server')
sys.path.insert(0, SERVER_DIR)

from Database.addItemsToDatabase import add_question

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "questions.json")

def load_questions():
    """
    Load questions from the JSON file.
    """
    if not os.path.exists(QUESTIONS_FILE):
        print(f"Error: {QUESTIONS_FILE} not found!")
        sys.exit(1)
    
    try:
        with open(QUESTIONS_FILE, 'r') as f:
            questions = json.load(f)
        print(f"Loaded {len(questions)} questions from {QUESTIONS_FILE}")
        return questions
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {QUESTIONS_FILE}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading questions: {e}")
        sys.exit(1)


def add_questions_to_database(questions, check_duplicates=True):
    """
    Add questions to the database directly using the add_question function.
    
    Args:
        questions: List of question dictionaries
        check_duplicates: Whether to check for duplicates (default: True)
    
    Returns:
        Tuple of (added_count, duplicate_count, error_count)
    """
    added_count = 0
    duplicate_count = 0
    error_count = 0
    
    for i, question in enumerate(questions, 1):
        try:
            text = question.get("text")
            question_type = question.get("question_type")
            resource_type = question.get("resource_type")
            choices = question.get("choices", [])
            correct_choices = question.get("correct_choices", [])
            
            # Validate required fields
            if not text:
                print(f"  [{i}] Skipping - missing text")
                error_count += 1
                continue
            
            # Add questions; check duplicates.
            question_id = add_question(
                text=text,
                question_type=question_type,
                resource_type=resource_type,
                choices=choices,
                correct_choices=correct_choices,
                check_duplicates=check_duplicates
            )
            
            print(f"  [{i}] Added: {text[:50]}...")
            added_count += 1
            
        except ValueError as e:
            if "Duplicate question detected" in str(e):
                print(f"  [{i}] Duplicate: {text[:50]}...")
                duplicate_count += 1
            else:
                print(f"  [{i}] Error: {e}")
                error_count += 1
        except Exception as e:
            print(f"  [{i}] Error: {e}")
            error_count += 1
    
    return added_count, duplicate_count, error_count


def main():
    """
    Main function to load and add default questions.
    """
    print("="*60)
    print("Adding Default Questions to Database")
    print("="*60)
    
    # Load questions from JSON file
    questions = load_questions()
    
    # Add questions to database
    print("\nAdding questions to database...")
    added, duplicates, errors = add_questions_to_database(questions, check_duplicates=True)
    
    # Print summary
    print("\n" + "="*60)
    print("Summary:")
    print(f"  Total questions in file: {len(questions)}")
    print(f"  Successfully added:      {added}")
    print(f"  Duplicates skipped:      {duplicates}")
    print(f"  Errors:                  {errors}")
    
if __name__ == "__main__":
    main()