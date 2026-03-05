/*
Unit tests for the QuestSection component

Covers: quest name/formula rendering, completed vs incomplete state,
progress string display, and multiple quests.
*/

import { render, screen } from "@testing-library/react";
import { QuestSection } from "../components/Sidebar/QuestSection";
import type { Quest } from "../types/Abstract.types";


const mockQuest: Quest = {

  moleculeName: "Water",
  moleculeFormula: "H2O",
  required: { H: 2, O: 1 },
  submitted: { H: 0, O: 0 },
  completed: false,
};


test("renders quest name", () => {
  render(<QuestSection quests={[mockQuest]} />);
  expect(screen.getByText(/Water/)).toBeInTheDocument();
  expect(screen.queryByText(/H2O/)).not.toBeInTheDocument();
});

test("shows incomplete icon for an incomplete quest", () => {
  render(<QuestSection quests={[mockQuest]} />);
  expect(screen.getByAltText("incomplete")).toBeInTheDocument();
});

test("shows completed icon for a completed quest", () => {
  const completed = { ...mockQuest, completed: true };
  render(<QuestSection quests={[completed]} />);
  expect(screen.getByAltText("completed")).toBeInTheDocument();
});

test("does not show progress string for an incomplete quest", () => {
  render(<QuestSection quests={[mockQuest]} />);
  expect(screen.queryByText(/0 \/ 2 H/)).not.toBeInTheDocument();
});

test("hides progress string for a completed quest", () => {
  const completed = { ...mockQuest, completed: true };
  render(<QuestSection quests={[completed]} />);
  expect(screen.queryByText(/0 \/ 2 H/)).not.toBeInTheDocument();
});

test("renders multiple quests", () => {
  const quest2: Quest = {
    moleculeName: "Ammonia",
    moleculeFormula: "NH3",
    required: { N: 1, H: 3 },
    submitted: { N: 0, H: 0 },
    completed: false,
  };
  render(<QuestSection quests={[mockQuest, quest2]} />);
  expect(screen.getByText(/Water/)).toBeInTheDocument();
  expect(screen.getByText(/Ammonia/)).toBeInTheDocument();
});

test("renders empty quest list without crashing", () => {
  render(<QuestSection quests={[]} />);
  expect(screen.getByText("QUESTS")).toBeInTheDocument();
});
