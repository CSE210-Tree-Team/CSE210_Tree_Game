/*
Game Screen Integration Tests for the WaterGame Component

This module contains integration tests for the game screen of the WaterGame
component. These tests verify that the game screen components (question
container, bucket, raindrops, point counter) render correctly, that the bucket 
moves correctly in response to arrow key presses, the correct point indicator
appears based on the raindrop caught, the point counter updates as questions 
are answered, and that the end screen displays the correct results after the 
player catches a correct or incorrect raindrop.
*/

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach } from "vitest";

import { WaterGame } from "../WaterGame";
import styles from "../WaterGame.module.css";
import type { RaindropAnswer } from "../types";
import type { Question } from "../../ServerCalls/ServerCalls";
import * as ServerCalls from "../../ServerCalls/ServerCalls";
import * as utils from "../utils";
import { INCORRECT, NUM_POINTS } from "../constants";

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

  const pointCount = screen.getByTestId("point-count");
  expect(pointCount).toBeInTheDocument();
  expect(pointCount).toHaveClass(styles.pointCount);

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

  await waitFor(
    () => {
      expect(screen.getByTestId("water-end")).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  expect(
    screen.getByText(/number of correctly answered questions: 1/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/number of incorrectly answered questions: 0/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/total number of points earned: 10/i),
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

// Checks that a correct point indicator appears when the bucket catches a correct raindrop
test("displays correct point indicator when bucket catches correct raindrop", async () => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue([
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
        { text: "70", isCorrect: true },
        { text: "30", isCorrect: false },
        { text: "50", isCorrect: false },
      ],
    },
  ] as Question[]);

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

  // Wait for correct point indicator to appear
  const point = await screen.findByTestId("point-0", {}, { timeout: 5000 });
  expect(point.textContent?.trim()).toContain(`+${NUM_POINTS}`);
}, 10000);

// Checks that an incorrect point indicator appears when the bucket catches an incorrect raindrop
test("displays incorrect point indicator when bucket catches incorrect raindrop", async () => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue([
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
        { text: "70", isCorrect: true },
        { text: "30", isCorrect: false },
        { text: "50", isCorrect: false },
      ],
    },
  ] as Question[]);

  vi.spyOn(utils, "shuffleArray").mockImplementation((array) => {
    const incorrect = (array as RaindropAnswer[]).filter((a) => !a.isCorrect);
    const correct = (array as RaindropAnswer[]).filter((a) => a.isCorrect);
    return [...incorrect, ...correct];
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

  // Wait for incorrect point indicator to appear
  const point = await screen.findByTestId("point-0", {}, { timeout: 5000 });
  expect(point.textContent?.trim()).toContain(INCORRECT);
}, 10000);

// Checks that the point indicator disappears after POINT_DURATION_MS
test("point indicator disappears after duration", async () => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue([
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
        { text: "70", isCorrect: true },
        { text: "30", isCorrect: false },
        { text: "50", isCorrect: false },
      ],
    },
  ] as Question[]);
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

  await screen.findByTestId("point-0", {}, { timeout: 5000 });

  await waitFor(
    () => {
      expect(screen.queryByTestId("point-0")).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}, 15000);

// Checks that point counter display increases when bucket catches correct raindrop
test("displays correct point count when bucket catches correct raindrop", async () => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue([
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
        { text: "70", isCorrect: true },
        { text: "30", isCorrect: false },
        { text: "50", isCorrect: false },
      ],
    },
  ] as Question[]);

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

  const pointCount = screen.getByTestId("point-count");
  await screen.findByTestId("point-0", {}, { timeout: 5000 });
  expect(pointCount.textContent?.trim()).toContain(`${NUM_POINTS} Points`);
}, 10000);

// Checks that point counter display doesn't increase when bucket catches incorrect raindrop
test("displays correct point counter display when bucket catches incorrect raindrop", async () => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue([
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
        { text: "70", isCorrect: true },
        { text: "30", isCorrect: false },
        { text: "50", isCorrect: false },
      ],
    },
  ] as Question[]);

  vi.spyOn(utils, "shuffleArray").mockImplementation((array) => {
    const incorrect = (array as RaindropAnswer[]).filter((a) => !a.isCorrect);
    const correct = (array as RaindropAnswer[]).filter((a) => a.isCorrect);
    return [...incorrect, ...correct];
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

  const pointCount = screen.getByTestId("point-count");
  await screen.findByTestId("point-0", {}, { timeout: 5000 });
  expect(pointCount.textContent?.trim()).toContain(`0 Points`);
}, 10000);
