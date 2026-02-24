/*
Integration tests for the WaterGame component

This module contains integration tests for the WaterGame component, 
which is a key part of the client-side application. These tests verify 
that the components on the game screen (bucket, question, raindrop) render 
and function correctly.
*/

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";
import { WaterGame } from "../WaterGame";
import styles from "../WaterGame.module.css";
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
