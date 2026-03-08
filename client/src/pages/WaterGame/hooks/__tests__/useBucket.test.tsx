/*
Unit Tests for the useBucket Hook

This module contains unit tests for the useBucket hook, which manages
the bucket's horizontal position, keyboard controls, and container ref
used for boundary clamping.
*/

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBucket } from "../useBucket";
import { BUCKET_WIDTH } from "../../constants";

// Helper to render hook with a mocked containerRef
const renderUseBucket = () => {
  const mockBucketXRef = { current: 0 };
  const { result } = renderHook(() => useBucket(mockBucketXRef));

  // Create a real div and attach it to containerRef
  const div = document.createElement("div");
  Object.defineProperty(div, "offsetWidth", {
    configurable: true,
    value: 800,
  });
  document.body.appendChild(div);

  // Manually set the containerRef to our div
  Object.defineProperty(result.current.containerRef, "current", {
    configurable: true,
    value: div,
  });

  return { result, mockBucketXRef, div };
};

afterEach(() => {
  // Clean up any divs added to body
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("useBucket", () => {
  it("initializes with bucketX of 0", () => {
    const { result } = renderUseBucket();
    expect(result.current.bucketX).toBe(0);
  });

  it("keeps bucketXRef in sync with bucketX state", () => {
    const { result, mockBucketXRef } = renderUseBucket();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(mockBucketXRef.current).toBe(result.current.bucketX);
  });

  it("moves bucket right on ArrowRight key press", () => {
    const { result } = renderUseBucket();
    const initialX = result.current.bucketX;

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(result.current.bucketX).toBeGreaterThan(initialX);
  });

  it("moves bucket left on ArrowLeft key press", () => {
    const { result } = renderUseBucket();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    const afterRightX = result.current.bucketX;

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });

    expect(result.current.bucketX).toBeLessThan(afterRightX);
  });

  it("does not move bucket past left boundary", () => {
    const { result } = renderUseBucket();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });

    expect(result.current.bucketX).toBe(0);
  });

  it("does not move bucket past right boundary", () => {
    const { result } = renderUseBucket();
    const maxRight = 800 - BUCKET_WIDTH;

    for (let i = 0; i < 50; i++) {
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight" }),
        );
      });
    }

    expect(result.current.bucketX).toBe(maxRight);
  });

  it("resets bucketX to 0", () => {
    const { result } = renderUseBucket();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(result.current.bucketX).toBeGreaterThan(0);

    act(() => {
      result.current.reset();
    });

    expect(result.current.bucketX).toBe(0);
  });

  it("removes keydown event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useBucket({ current: 0 }));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });
});
