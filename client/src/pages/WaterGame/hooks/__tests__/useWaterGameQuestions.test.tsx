/*
Unit Tests for the useWaterGameQuestions Hook

This module contains unit tests for the useWaterGameQuestions hook, which
fetches water game questions from the server and manages loading and error
states during the fetch lifecycle.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWaterGameQuestions } from "../useWaterGameQuestions";
import * as ServerCalls from "../../../ServerCalls/ServerCalls";
import type { Question } from "../../../ServerCalls/ServerCalls";

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

beforeEach(() => {
  vi.spyOn(ServerCalls, "fetchQuestions").mockResolvedValue(mockQuestions);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useWaterGameQuestions", () => {
  it("starts in loading state with empty questions", () => {
    const { result } = renderHook(() => useWaterGameQuestions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.questions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("returns questions on successful fetch", async () => {
    const { result } = renderHook(() => useWaterGameQuestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.questions).toEqual(mockQuestions);
    expect(result.current.error).toBeNull();
  });

  it("sets error state when fetch fails", async () => {
    vi.spyOn(ServerCalls, "fetchQuestions").mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useWaterGameQuestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Failed to load questions. Please try again.",
    );
    expect(result.current.questions).toEqual([]);
  });

  it("calls handle401Error on AuthenticationError", async () => {
    vi.spyOn(ServerCalls, "fetchQuestions").mockRejectedValue(
      new ServerCalls.AuthenticationError("Unauthorized"),
    );
    const handle401Mock = vi.spyOn(ServerCalls, "handle401Error");

    const { result } = renderHook(() => useWaterGameQuestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(handle401Mock).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("calls fetchQuestions with correct arguments", async () => {
    const fetchMock = vi.spyOn(ServerCalls, "fetchQuestions");

    const { result } = renderHook(() => useWaterGameQuestions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(Number), "Water", "MCQ");
  });

  it("sets isLoading to false after fetch completes", async () => {
    const { result } = renderHook(() => useWaterGameQuestions());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
