/*
Integration tests for the WaterGame component

This module contains integration tests for the WaterGame component, 
which is a key part of the client-side application. These tests verify 
that the components on the game screen (bucket, question, raindrop) render 
and function correctly.
*/

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";

import { WaterGame } from "../WaterGame";
import styles from "../WaterGame.module.css";
import type { RaindropAnswer } from "../types";
import type { WaterQuestion } from "../../ServerCalls/ServerCalls";
import * as ServerCalls from "../../ServerCalls/ServerCalls";
import * as utils from "../utils";

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

// Renders the game screen and checks all components are present (question container, bucket, etc...)
test("renders game screen and checks for all components", async () => {
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

  const question = screen.getByTestId("question");
  expect(question).toBeInTheDocument();

  const bucketContainer = screen.getByTestId("bucket-container");
  expect(bucketContainer).toBeInTheDocument();
  expect(bucketContainer).toHaveClass(styles.bucketContainer);

  const bucket = screen.getByTestId("bucket");
  expect(bucket).toBeInTheDocument();
});

// Renders the game screen and checks that pressing the right arrow key moves the bucket to the right
test("ArrowRight moves the bucket to the right", async () => {
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
  const bucket = screen.getByTestId("bucket");

  const initialLeft = parseInt(bucket.style.left, 10);
  await user.keyboard("{ArrowRight}");
  const newLeft = parseInt(bucket.style.left, 10);
  expect(newLeft).toBeGreaterThan(initialLeft);
});

// Renders the game screen and checks that pressing the left arrow key moves the bucket to the left
test("ArrowLeft moves the bucket to the left", async () => {
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
  const bucket = screen.getByTestId("bucket");

  const initialLeft = bucket.style.left;
  await user.keyboard("{ArrowLeft}");
  expect(bucket.style.left).not.toBe(initialLeft);
});

// Checks that pressing the left arrow key does not move bucket if already at leftmost position
test("bucket does not move past the left boundary", async () => {
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

  const bucket = screen.getByTestId("bucket");

  bucket.style.left = "0px";

  await user.keyboard("{ArrowLeft}");
  expect(bucket.style.left).toBe("0px");
});

// Checks that pressing the right arrow key does not move bucket if already at rightmost position
test("bucket does not move past the right boundary", async () => {
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
  const bucketContainer = screen.getByTestId("bucket-container");
  const bucket = screen.getByTestId("bucket");

  Object.defineProperty(bucketContainer, "offsetWidth", {
    configurable: true,
    value: 500,
  });

  const bucketWidth = 140;
  const maxRight = 500 - bucketWidth;

  for (let i = 0; i < 50; i++) {
    await user.keyboard("{ArrowRight}");
  }

  expect(bucket.style.left).toBe(`${maxRight}px`);
});

test("displays correct results on end screen after catching a correct raindrop", async () => {
  vi.spyOn(utils, "shuffleArray").mockImplementation((array) => {
    const incorrect = (array as RaindropAnswer[]).filter((a) => !a.isCorrect);
    const correct = (array as RaindropAnswer[]).filter((a) => a.isCorrect);
    return [...correct, ...incorrect];
  });

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

  // Wait for game to end after raindrop is caught
  await waitFor(
    () => {
      expect(screen.getByTestId("water-end")).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  // H2O is the correct answer so correctCount should be 1
  expect(
    screen.getByText(/number of correctly answered questions: 1/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/number of incorrectly answered questions: 0/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/total number of points earned: 100/i),
  ).toBeInTheDocument();
}, 10000);

test("displays correct results on end screen after catching an incorrect raindrop", async () => {
  vi.spyOn(utils, "shuffleArray").mockImplementation((array) => {
    const incorrect = (array as RaindropAnswer[]).filter((a) => !a.isCorrect);
    const correct = (array as RaindropAnswer[]).filter((a) => a.isCorrect);
    return [...incorrect, ...correct];
  });

  vi.spyOn(Math, "random").mockReturnValue(0.4125); // raindrop spawns at bucket center

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

  await waitFor(
    () => {
      expect(screen.getByTestId("water-end")).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  expect(
    screen.getByText(/number of correctly answered questions: 0/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/number of incorrectly answered questions: 1/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/total number of points earned: 0/i),
  ).toBeInTheDocument();
}, 10000);
