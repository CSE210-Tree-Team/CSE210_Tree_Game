/*
Unit Tests for the useGameLoop Hook

This module contains unit tests for the useGameLoop hook, which manages
the raindrop spawning, movement, collision detection, and question cycling
during the game loop.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGameLoop } from "../useGameLoop";
import * as collision from "../../utils/collision";
import * as raindropHelper from "../../utils/raindropHelper";
import type { Question } from "../../../ServerCalls/types";

const mockQuestions: Question[] = [
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
    text: "What percentage of earth is covered in water?",
    type: "MCQ",
    choices: [
      { text: "70", isCorrect: true },
      { text: "30", isCorrect: false },
      { text: "50", isCorrect: false },
    ],
  },
];

const mockBucketXRef = { current: 100 };
const mockGameScreenRef = {
  current: {
    offsetHeight: 800,
    offsetWidth: 800,
  } as unknown as HTMLDivElement,
};

const mockOnAnswer = vi.fn();
const mockOnGameEnd = vi.fn();

const defaultProps = {
  questions: mockQuestions,
  bucketXRef: mockBucketXRef,
  gameScreenRef: mockGameScreenRef,
  onAnswer: mockOnAnswer,
  onGameEnd: mockOnGameEnd,
};

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  // Mock shuffleArray to return array as-is for predictable order
  vi.spyOn(raindropHelper, "shuffleArray").mockImplementation((array) => array);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockOnAnswer.mockReset();
  mockOnGameEnd.mockReset();
});

describe("useGameLoop", () => {
  it("initializes with empty raindrops and question index 0", () => {
    const { result } = renderHook(() => useGameLoop(defaultProps));

    expect(result.current.raindrops).toHaveLength(0);
    expect(result.current.currentQuestionIndex).toBe(0);
  });

  it("spawns a raindrop after spawn interval", async () => {
    const { result } = renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(result.current.raindrops.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });

  it("spawned raindrop has correct properties", async () => {
    const { result } = renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(result.current.raindrops.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    const drop = result.current.raindrops[0];
    expect(drop).toHaveProperty("id");
    expect(drop).toHaveProperty("x");
    expect(drop).toHaveProperty("y");
    expect(drop).toHaveProperty("answer");
    expect(drop).toHaveProperty("isCorrect");
  });

  it("calls onAnswer when raindrop collides with bucket", async () => {
    vi.spyOn(collision, "checkCollision").mockReturnValue(true);

    renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(mockOnAnswer).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  });

  it("advances to next question after collision", async () => {
    vi.spyOn(collision, "checkCollision").mockReturnValue(true);

    const { result } = renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(result.current.currentQuestionIndex).toBe(1);
      },
      { timeout: 3000 },
    );
  });

  it("calls onGameEnd when last question is answered", async () => {
    vi.spyOn(collision, "checkCollision").mockReturnValue(true);

    const { result } = renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(result.current.currentQuestionIndex).toBe(1);
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(mockOnGameEnd).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  }, 10000);

  it("pauses spawning and movement when tab is hidden", async () => {
    const { result } = renderHook(() => useGameLoop(defaultProps));

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const raindropCountWhilePaused = result.current.raindrops.length;

    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(result.current.raindrops.length).toBe(raindropCountWhilePaused);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  }, 5000);

  it("resets raindrops and question index on reset", async () => {
    vi.spyOn(collision, "checkCollision").mockReturnValue(true);

    const { result } = renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(result.current.currentQuestionIndex).toBe(1);
      },
      { timeout: 3000 },
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.raindrops).toHaveLength(0);
    expect(result.current.currentQuestionIndex).toBe(0);
  });

  it("does not call onAnswer twice for the same raindrop", async () => {
    vi.spyOn(collision, "checkCollision").mockReturnValue(true);

    renderHook(() => useGameLoop(defaultProps));

    await waitFor(
      () => {
        expect(mockOnAnswer).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    const callCount = mockOnAnswer.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockOnAnswer.mock.calls.length).toBe(callCount);
  });
});
