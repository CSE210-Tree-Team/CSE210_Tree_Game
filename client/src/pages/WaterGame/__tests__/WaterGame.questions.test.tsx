/*
Integration tests for the question in WaterGame component

This module contains integration tests for the question 
within the WaterGame, which is essential for displaying the correct
questions to the users. These tests verify the correct questions are 
rendered, and that the question displayed switches once the previous 
has been answered.
*/

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";
import { WaterGame } from "../WaterGame";
import type { Question } from "../../ServerCalls/ServerCalls";
import * as ServerCalls from "../../ServerCalls/ServerCalls";

const mockQuestions = [
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
  {
    questionID: "2",
    difficulty: 1,
    resourceType: "Water",
    text: "What percentage of the earth is covered in water?",
    type: "MCQ",
    choices: [
      { text: "30", isCorrect: false },
      { text: "50", isCorrect: false },
      { text: "70", isCorrect: true },
      { text: "100", isCorrect: false },
    ],
  },
];

beforeEach(() => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue(
    mockQuestions as Question[],
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
  expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();
});

test("shows loading indicator while questions are being fetched", async () => {
  let resolveQuestions!: (value: Question[]) => void;
  const questionsPromise = new Promise<Question[]>((resolve) => {
    resolveQuestions = resolve;
  });

  vi.spyOn(ServerCalls, "fetchQuestions").mockReturnValue(questionsPromise);

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  resolveQuestions(mockQuestions as Question[]);
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(screen.getByTestId("water-start")).toBeInTheDocument();
});

test("question text updates after bucket catching raindrop", async () => {
  vi.spyOn(Math, "random").mockReturnValue(0.4125);
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 200,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await screen.findByTestId("water-start");
  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  expect(screen.getByText(mockQuestions[0].text)).toBeInTheDocument();

  await waitFor(
    () => {
      expect(screen.getByText(mockQuestions[1].text)).toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}, 10000);
