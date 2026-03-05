"""
Full-stack question integration tests.

These tests load default questions, write them to a temporary database, pull
Earth MultiSelect questions, and verify manager filters and adapter parsing.
"""

import os
import re
import sys
import tempfile
import shutil
import subprocess
import unittest

# Add repo root and server directory to path for imports.
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TESTS_DIR)
SERVER_DIR = os.path.join(REPO_ROOT, "server")
sys.path.insert(0, REPO_ROOT)
sys.path.insert(0, SERVER_DIR)

from database.createDatabase import create_schema
import database.addItemsToDatabase as addItemsToDatabase
import database.getItemsFromDatabase as getItemsFromDatabase
import database.createDatabase as createDatabase

from utils.addDefaultQuestions import load_questions, add_questions_to_database
from database.getItemsFromDatabase import get_questions


ELEMENT_PATTERN = re.compile(r"^(\d+)?([A-Z][a-z]*)$")


def parse_element_count(value: str):
    trimmed = value.strip()
    if not trimmed:
        return None

    match = ELEMENT_PATTERN.match(trimmed)
    if not match:
        return None

    count = int(match.group(1)) if match.group(1) else 1
    if count <= 0:
        return None

    return {"count": count, "symbol": match.group(2)}


def to_soil_quest(question: dict):
    if not isinstance(question.get("resourceType"), str):
        return None
    if question["resourceType"].lower() != "earth":
        return None

    question_text = question.get("text", "")
    name_part, sep, formula_part = question_text.partition("/")
    molecule_name = name_part.strip()
    molecule_formula = formula_part.strip() if sep else ""

    if not molecule_name or not molecule_formula:
        return None

    required = {}
    choices = question.get("choices") or []
    for choice in choices:
        if not choice.get("isCorrect"):
            continue
        if not isinstance(choice.get("text"), str):
            return None

        parsed = parse_element_count(choice["text"])
        if not parsed:
            return None

        required[parsed["symbol"]] = required.get(parsed["symbol"], 0) + parsed["count"]

    if not required:
        return None

    return {
        "moleculeName": molecule_name,
        "moleculeFormula": molecule_formula,
        "required": required,
        "submitted": {},
        "completed": False,
    }


class TestQuestionQuestIntegration(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, "game_database.db")

        addItemsToDatabase.DB_PATH = self.db_path
        getItemsFromDatabase.DB_PATH = self.db_path
        createDatabase.DB_PATH = self.db_path

        create_schema(self.db_path)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_earth_questions_round_trip_to_quests(self):
        questions = load_questions()
        added, duplicates, errors = add_questions_to_database(questions, check_duplicates=False)

        self.assertEqual(errors, 0, "Default questions should load without errors.")
        self.assertGreater(added, 0, "Expected questions to be added to the database.")
        self.assertEqual(duplicates, 0, "Unexpected duplicates while loading defaults.")

        earth_questions = get_questions(resource_type="Earth", question_type="MultiSelect")
        by_text = {q["text"]: q for q in earth_questions}

        expected_required = {
            "Water/H2O": {"H": 2, "O": 1},
            "Carbon Dioxide/CO2": {"C": 1, "O": 2},
            "Ammonia/NH3": {"N": 1, "H": 3},
            "Methane/CH4": {"C": 1, "H": 4},
            "Sodium Chloride/NaCl": {"Na": 1, "Cl": 1},
            "Glucose/C6H12O6": {"C": 6, "H": 12, "O": 6},
        }

        for text in expected_required:
            self.assertIn(text, by_text, f"Missing earth question: {text}")

        for text, required in expected_required.items():
            quest = to_soil_quest(by_text[text])
            self.assertIsNotNone(quest, f"Quest conversion failed for {text}")
            self.assertEqual(quest["required"], required)

    def test_manager_filters_and_adapter_parsing(self):
        questions = load_questions()
        add_questions_to_database(questions, check_duplicates=False)

        manager_count = 3
        earth_questions = get_questions(
            num_questions=manager_count,
            resource_type="Earth",
            question_type="MultiSelect",
        )

        self.assertEqual(
            len(earth_questions),
            manager_count,
            "Question manager should fetch the requested number of questions.",
        )

        for question in earth_questions:
            quest = to_soil_quest(question)
            self.assertIsNotNone(quest, "Adapter failed to parse an earth question.")

    def test_manager_and_adapter_with_node_runner(self):
        tsx_path = os.path.join(REPO_ROOT, "client", "node_modules", ".bin", "tsx")
        runner_path = os.path.join(REPO_ROOT, "fullstack_tests", "soilGameManagerAdapterRunner.ts")

        if not os.path.exists(tsx_path):
            self.fail("tsx not found. Run npm ci in client before running this test.")

        result = subprocess.run([tsx_path, runner_path], cwd=REPO_ROOT, check=False)
        self.assertEqual(
            result.returncode,
            0,
            "Manager/adapter runner failed. See output for details.",
        )


if __name__ == "__main__":
    unittest.main()
