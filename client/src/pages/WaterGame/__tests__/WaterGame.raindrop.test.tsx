/*
Integration tests for the raindrop in WaterGame component

This module contains integration tests for the Raindrop component, 
within the WaterGame, which is essential for tracking the player's
progress throughout the minigame. These tests verify the raindrop
animations are as expected: render within horizontal bounds, move
downward over time, spawn at a specified interval, and disappears
once it hits the floor.
*/

import { test, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";

import { WaterGame } from "../WaterGame";
import { SPAWN_INTERVAL_MS, RAINDROP_WIDTH } from "../constants";
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
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("spawns raindrops within container bounds", async () => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
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

  const raindrop = await screen.findByTestId(
    "raindrop-0",
    {},
    { timeout: 3000 },
  );

  const left = parseFloat(raindrop.style.left);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(left).toBeLessThanOrEqual(800 - RAINDROP_WIDTH);
});

test("raindrop moves downward over time", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
  });

  await screen.findByTestId("water-start");
  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  const raindrop = await screen.findByTestId(
    "raindrop-0",
    {},
    { timeout: 3000 },
  );
  const initialTop = parseFloat(raindrop.style.top);

  await waitFor(
    () => {
      const currentText = screen.getByText("H2O");
      const currentTop = parseFloat(currentText.closest("div")!.style.top);

      expect(currentTop).toBeGreaterThan(initialTop);
    },
    { timeout: 1500 },
  );
});

test("raindrop disappears once it hits the bottom", async () => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 200,
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

  await screen.findByTestId("raindrop-0", {}, { timeout: 3000 });

  await waitFor(
    () => {
      expect(screen.queryByTestId("raindrop-0")).not.toBeInTheDocument();
    },
    { timeout: 3000 },
  );
});

test("raindrops spawn at the correct interval", async () => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
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

  expect(screen.queryByTestId("raindrop-0")).not.toBeInTheDocument();

  await screen.findByTestId("raindrop-0", {}, { timeout: SPAWN_INTERVAL_MS });
  expect(screen.queryByTestId("raindrop-1")).not.toBeInTheDocument();

  await screen.findByTestId("raindrop-1", {}, { timeout: SPAWN_INTERVAL_MS });
}, 10000);

test("renders fetched question choices as raindrop answers", async () => {
  const user = userEvent.setup();

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
  });

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await screen.findByTestId("water-start");
  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  // Wait for all choices to appear as raindrop answers
  for (const choice of mockWaterQuestions[0].choices) {
    await screen.findByText(choice.text, {}, { timeout: 5000 });
  }
}, 10000);
