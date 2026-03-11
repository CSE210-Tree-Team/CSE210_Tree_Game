/*
Navigation tests for the WaterGame component

This module contains the integration tests for navigating different screens 
throughout the WaterGame component, which is a key part of the client-side 
application. These tests verify that the different screens (start, tutorial, 
game, end) render correctly and that navigation between them works as expected.
*/

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";

import { WaterGame } from "../index";
import type { Question } from "../../ServerCalls/ServerCalls";
import * as ServerCalls from "../../ServerCalls/ServerCalls";

vi.mock("../../../AudioSystem", () => ({
  audioSystem: {
    playAmbient: vi.fn(),
    stopAmbient: vi.fn(),
    fadeOut: vi.fn(),
  },
}));

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
];

beforeEach(() => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue(
    mockQuestions as Question[],
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Renders the start screen and navigates through the home and tutorial screen using the buttons
test("renders start screen and navigates through game screens", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Start screen
  await screen.findByTestId("water-start");
  const playButton = screen.getByRole("button", { name: /play/i });
  expect(playButton).toBeInTheDocument();

  // Click Play to go to tutorial
  await user.click(playButton);
  expect(screen.getByTestId("water-tutorial")).toBeInTheDocument();
  const readyButton = screen.getByRole("button", { name: /i'm ready/i });
  expect(readyButton).toBeInTheDocument();

  await user.click(readyButton);
  expect(screen.getByTestId("water-game")).toBeInTheDocument();
});

// Renders the tutorial screen and returns to the start screen using the back arrow
test("back arrow navigates back to start screen from tutorial", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Start screen
  await screen.findByTestId("water-start");
  const playButton = screen.getByRole("button", { name: /play/i });
  await user.click(playButton);

  // Tutorial screen
  expect(screen.getByTestId("water-tutorial")).toBeInTheDocument();
  const backArrow = screen.getByAltText(/water game back arrow/i);
  expect(backArrow).toBeInTheDocument();

  // Click back arrow to return to start screen
  await user.click(backArrow);
  expect(screen.getByTestId("water-start")).toBeInTheDocument();
});

// Renders the start screen and uses the back arrow to navigate back to the home page
test("back arrow navigates back to home from start screen", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Start screen
  await screen.findByTestId("water-start");
  const backArrow = screen.getByAltText(/water game back arrow/i);
  expect(backArrow).toBeInTheDocument();

  // Click back arrow to return to home
  await user.click(backArrow);
  // Since we are using MemoryRouter, we can check if the URL changed to "/"
  expect(window.location.pathname).toBe("/");
});

// Renders the tutorial screen and confirms expected components (header & instructions) are present
test("renders tutorial header and instructions", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Navigate to tutorial screen
  await screen.findByTestId("water-start");
  await user.click(screen.getByRole("button", { name: /play/i }));

  // Ensure tutorial header is present
  expect(screen.getByText(/how to play/i)).toBeInTheDocument();

  // Ensure a list exists
  const list = screen.getByRole("list");
  expect(list).toBeInTheDocument();

  // Ensure correct number of instructions
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(5);
});

test("renders results screen and game results", async () => {
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

  // Wait for the game to end after the only question is answered
  await waitFor(
    () => {
      expect(screen.getByTestId("water-end")).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  expect(screen.getByText(/good job/i)).toBeInTheDocument();

  const list = screen.getByRole("list");
  expect(list).toBeInTheDocument();

  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(3);
}, 10000);

// Renders the game screen and skips to the end screen using the exit icon
test("x navigates exits game early and navigates to end screen", async () => {
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
  const exit = screen.getByAltText(/water game exit/i);
  expect(exit).toBeInTheDocument();

  await user.click(exit);
  expect(screen.getByTestId("water-end")).toBeInTheDocument();
});
