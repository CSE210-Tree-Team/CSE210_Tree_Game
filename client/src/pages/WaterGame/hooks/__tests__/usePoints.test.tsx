/*
Unit Tests for the usePoints Hook

This module contains unit tests for the usePoints hook, which manages
the spawning, positioning, and removal of point indicators when the
player catches a raindrop with the bucket.
*/

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePoints } from "../usePoints";
import {
  POINT_DURATION_MS,
  BUCKET_WIDTH,
  POINT_WIDTH,
  BUCKET_HEIGHT,
  POINT_GAP,
} from "../../constants";

const mockBucketXRef = { current: 100 };
const mockGameScreenRef = {
  current: {
    offsetHeight: 800,
    style: {},
  } as unknown as HTMLDivElement,
};

// Mock getComputedStyle to return a predictable padding value
beforeEach(() => {
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    paddingBottom: "64",
  } as unknown as CSSStyleDeclaration);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePoints", () => {
  it("initializes with empty points array", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    expect(result.current.points).toHaveLength(0);
  });

  it("spawns a correct point with correct variant", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(true);
    });

    expect(result.current.points).toHaveLength(1);
    expect(result.current.points[0].variant).toBe("correct");
  });

  it("spawns an incorrect point with incorrect variant", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(false);
    });

    expect(result.current.points).toHaveLength(1);
    expect(result.current.points[0].variant).toBe("incorrect");
  });

  it("spawns point at correct x position", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(true);
    });

    const expectedX =
      mockBucketXRef.current + (BUCKET_WIDTH / 2 - POINT_WIDTH / 2) + 64;
    expect(result.current.points[0].x).toBe(expectedX);
  });

  it("spawns point at correct y position", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(true);
    });

    const expectedY =
      mockGameScreenRef.current.offsetHeight - BUCKET_HEIGHT - POINT_GAP - 64;
    expect(result.current.points[0].y).toBe(expectedY);
  });

  it("assigns unique ids to each spawned point", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(true);
      result.current.spawnPoint(false);
    });

    const ids = result.current.points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(
    "removes point after POINT_DURATION_MS",
    async () => {
      const { result } = renderHook(() =>
        usePoints(mockBucketXRef, mockGameScreenRef),
      );

      act(() => {
        result.current.spawnPoint(true);
      });

      expect(result.current.points).toHaveLength(1);

      await waitFor(
        () => {
          expect(result.current.points).toHaveLength(0);
        },
        { timeout: POINT_DURATION_MS + 500 },
      );
    },
    POINT_DURATION_MS + 2000,
  );

  it("does not spawn point if gameScreenRef is null", () => {
    const nullGameScreenRef = { current: null };
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, nullGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(true);
    });

    expect(result.current.points).toHaveLength(0);
  });

  it("resets points and id counter", () => {
    const { result } = renderHook(() =>
      usePoints(mockBucketXRef, mockGameScreenRef),
    );

    act(() => {
      result.current.spawnPoint(true);
      result.current.spawnPoint(false);
    });

    expect(result.current.points).toHaveLength(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.points).toHaveLength(0);

    // After reset, next point should have id 0
    act(() => {
      result.current.spawnPoint(true);
    });

    expect(result.current.points[0].id).toBe(0);
  });
});
