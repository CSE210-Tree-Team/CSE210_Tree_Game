/*
Integration tests for the raindrop in WaterGame component

This module contains integration tests for the Raindrop component, 
within the WaterGame, which is essential for tracking the player's
progress throughout the minigame. These tests verify the raindrop
animations are as expected: render within horizontal bounds, move
downward over time, spawn at a specified interval, disappears
once it hits the floor, and renders corresponding answer choices.
*/

import { test, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";

import { WaterGame } from "../WaterGame";
import { SPAWN_INTERVAL_MS, RAINDROP_WIDTH } from "../constants";
import type { Question } from "../../ServerCalls/ServerCalls";
import * as ServerCalls from "../../ServerCalls/ServerCalls";
import * as utils from "../utils";

vi.mock('../../../AudioSystem', () => ({
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

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });

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
  const initialTop = parseFloat(raindrop.style.top);

  await waitFor(
    () => {
      const currentTop = parseFloat(screen.getByTestId("raindrop-0").style.top);
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

  await screen.findByTestId(
    "raindrop-0",
    {},
    { timeout: SPAWN_INTERVAL_MS + 500 },
  );
  expect(screen.queryByTestId("raindrop-1")).not.toBeInTheDocument();

  await screen.findByTestId(
    "raindrop-1",
    {},
    { timeout: SPAWN_INTERVAL_MS + 500 },
  );
}, 10000);

test("renders fetched question choices as raindrop answers", async () => {
  vi.spyOn(utils, "shuffleArray").mockImplementation((array) => array);

  const user = userEvent.setup();

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await screen.findByTestId("water-start");
  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  await screen.findByText("H2O", {}, { timeout: 5000 });
  await screen.findByText("CO2", {}, { timeout: 5000 });
  await screen.findByText("O2", {}, { timeout: 5000 });
}, 10000);
