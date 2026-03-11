/*
Unit Tests for the useWaterGame Hook

This module contains unit tests for the useWaterGame hook, which
orchestrates the game state, screen transitions, score tracking,
and audio for the WaterGame.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWaterGame } from "../useWaterGame";
import * as useWaterGameQuestionsModule from "../useWaterGameQuestions";
import * as useGameLoopModule from "../useGameLoop";
import * as usePointsModule from "../usePoints";
import { audioSystem } from "../../../../AudioSystem";
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
];

const mockResetGameLoop = vi.fn();
const mockResetPoints = vi.fn();
const mockSpawnPoint = vi.fn();
const mockStopAmbient = vi.fn();
const mockPlayAmbient = vi.fn();

beforeEach(() => {
  vi.spyOn(
    useWaterGameQuestionsModule,
    "useWaterGameQuestions",
  ).mockReturnValue({
    questions: mockQuestions,
    isLoading: false,
    error: null,
  });

  vi.spyOn(useGameLoopModule, "useGameLoop").mockReturnValue({
    raindrops: [],
    currentQuestionIndex: 0,
    reset: mockResetGameLoop,
  });

  vi.spyOn(usePointsModule, "usePoints").mockReturnValue({
    points: [],
    spawnPoint: mockSpawnPoint,
    reset: mockResetPoints,
  });

  vi.spyOn(audioSystem, "playAmbient").mockImplementation(mockPlayAmbient);
  vi.spyOn(audioSystem, "stopAmbient").mockImplementation(mockStopAmbient);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockResetGameLoop.mockReset();
  mockResetPoints.mockReset();
  mockSpawnPoint.mockReset();
  mockStopAmbient.mockReset();
  mockPlayAmbient.mockReset();
});

describe("useWaterGame", () => {
  it("initializes on the start screen", () => {
    const { result } = renderHook(() => useWaterGame());
    expect(result.current.screen).toBe("start");
  });

  it("initializes with zero correct and incorrect counts", () => {
    const { result } = renderHook(() => useWaterGame());
    expect(result.current.correctCount).toBe(0);
    expect(result.current.incorrectCount).toBe(0);
  });

  it("returns questions and loading state from useWaterGameQuestions", () => {
    const { result } = renderHook(() => useWaterGame());
    expect(result.current.questions).toEqual(mockQuestions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("transitions to game screen on startGame", () => {
    const { result } = renderHook(() => useWaterGame());

    act(() => {
      result.current.startGame();
    });

    expect(result.current.screen).toBe("game");
  });

  it("resets game loop and points on startGame", () => {
    const { result } = renderHook(() => useWaterGame());

    act(() => {
      result.current.startGame();
    });

    expect(mockResetGameLoop).toHaveBeenCalled();
    expect(mockResetPoints).toHaveBeenCalled();
  });

  it("resets scores on startGame", () => {
    const { result } = renderHook(() => useWaterGame());

    // Manually set screen to end to simulate a completed game
    act(() => {
      result.current.setScreen("end");
    });

    act(() => {
      result.current.startGame();
    });

    expect(result.current.correctCount).toBe(0);
    expect(result.current.incorrectCount).toBe(0);
  });

  it("plays audio on startGame", () => {
    const { result } = renderHook(() => useWaterGame());

    act(() => {
      result.current.startGame();
    });

    expect(mockPlayAmbient).toHaveBeenCalled();
  });

  it("does not start game if questions are empty", () => {
    vi.spyOn(
      useWaterGameQuestionsModule,
      "useWaterGameQuestions",
    ).mockReturnValue({
      questions: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useWaterGame());

    act(() => {
      result.current.startGame();
    });

    expect(result.current.screen).toBe("start");
  });

  it("stops audio on stopAudio", () => {
    const { result } = renderHook(() => useWaterGame());

    act(() => {
      result.current.stopAudio();
    });

    expect(mockStopAmbient).toHaveBeenCalled();
  });

  it("transitions to end screen when onGameEnd is called", () => {
    const { result } = renderHook(() => useWaterGame());

    // Extract the onGameEnd callback passed to useGameLoop and call it
    const onGameEnd = (
      useGameLoopModule.useGameLoop as ReturnType<typeof vi.fn>
    ).mock.calls[0][0].onGameEnd;

    act(() => {
      onGameEnd();
    });

    expect(result.current.screen).toBe("end");
  });

  it("increments correctCount when handleAnswer is called with true", () => {
    const { result } = renderHook(() => useWaterGame());

    const onAnswer = (useGameLoopModule.useGameLoop as ReturnType<typeof vi.fn>)
      .mock.calls[0][0].onAnswer;

    act(() => {
      onAnswer(true);
    });

    expect(result.current.correctCount).toBe(1);
  });

  it("increments incorrectCount when handleAnswer is called with false", () => {
    const { result } = renderHook(() => useWaterGame());

    const onAnswer = (useGameLoopModule.useGameLoop as ReturnType<typeof vi.fn>)
      .mock.calls[0][0].onAnswer;

    act(() => {
      onAnswer(false);
    });

    expect(result.current.incorrectCount).toBe(1);
  });

  it("spawns a point when handleAnswer is called", () => {
    const { result } = renderHook(() => useWaterGame());

    const onAnswer = (useGameLoopModule.useGameLoop as ReturnType<typeof vi.fn>)
      .mock.calls[0][0].onAnswer;

    act(() => {
      onAnswer(true);
    });

    expect(mockSpawnPoint).toHaveBeenCalledWith(true);
  });
});
