"""Bootstrap database and seed default content only when needed."""

import os

from database.createDatabase import DB_PATH, create_schema
from utils.addDefaultQuestions import main as seed_default_questions


def bootstrap() -> None:
    """Initialize database artifacts lazily to keep restarts lightweight."""
    if os.path.exists(DB_PATH):
        print(f"Database already exists at {DB_PATH}; skipping schema + seed")
        return

    print(f"Database not found at {DB_PATH}; creating schema and seeding defaults")
    create_schema(DB_PATH)
    seed_default_questions()


if __name__ == "__main__":
    bootstrap()
