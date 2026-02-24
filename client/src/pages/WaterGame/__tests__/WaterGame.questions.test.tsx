/*
Integration tests for the WaterGame component

This module contains integration tests for the WaterGame component, 
which is a key part of the client-side application. These tests verify 
that the different screens (start, tutorial, game, end) render correctly 
and that navigation between them works as expected.
*/

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";
import { WaterGame } from "../WaterGame";
import type { WaterQuestion } from "../../ServerCalls/ServerCalls";
import * as ServerCalls from "../../ServerCalls/ServerCalls";

const mockWaterQuestions = [
  {
    questionID: "1",
    difficulty: 1,
    resourceType: "Water",
    text: "What is the chemical formula for water?",
    type: "MCQ",
    choices: [
      { text: "H2O", isCorrect: true },
      { text: "CO2", isCorrect: false },
      { text: "O2", isCorrect: false },
    ],
  },
];

beforeEach(() => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue(
    mockWaterQuestions as WaterQuestion[],
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders fetched question text on game screen", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await screen.findByTestId("water-start");
  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  expect(screen.getByTestId("water-game")).toBeInTheDocument();
  expect(screen.getByText(mockWaterQuestions[0].text)).toBeInTheDocument();
});

test("shows loading indicator while questions are being fetched", async () => {
  let resolveQuestions!: (value: WaterQuestion[]) => void;
  const questionsPromise = new Promise<WaterQuestion[]>((resolve) => {
    resolveQuestions = resolve;
  });

  vi.spyOn(ServerCalls, "fetchQuestions").mockReturnValue(questionsPromise);

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  resolveQuestions(mockWaterQuestions as WaterQuestion[]);
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(screen.getByTestId("water-start")).toBeInTheDocument();
});

// TODO: Add tests for updated text when move onto next question
