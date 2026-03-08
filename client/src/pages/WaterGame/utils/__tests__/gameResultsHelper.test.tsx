/*
Unit Tests for the submitGameResults utility function

This module contains unit tests for the submitGameResults function, which
pushes the player's game results to the server and handles navigation and
error cases.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitGameResults } from "../gameResultsHelper";
import * as ServerCalls from "../../../ServerCalls/ServerCalls";

beforeEach(() => {
  // Mock window.location.href
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { href: "" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitGameResults", () => {
  it("calls pushGameResults with correct arguments", async () => {
    const pushMock = vi
      .spyOn(ServerCalls, "pushGameResults")
      .mockResolvedValue(true);

    await submitGameResults(100, "Water");

    expect(pushMock).toHaveBeenCalledWith(100, "Water");
  });

  it("navigates to home on success", async () => {
    vi.spyOn(ServerCalls, "pushGameResults").mockResolvedValue(true);

    await submitGameResults(100, "Water");

    expect(window.location.href).toBe("/");
  });

  it("calls handle401Error on AuthenticationError", async () => {
    vi.spyOn(ServerCalls, "pushGameResults").mockRejectedValue(
      new ServerCalls.AuthenticationError("Unauthorized"),
    );
    const handle401Mock = vi.spyOn(ServerCalls, "handle401Error");

    await submitGameResults(100, "Water");

    expect(handle401Mock).toHaveBeenCalled();
  });

  it("navigates to home on non-authentication error", async () => {
    vi.spyOn(ServerCalls, "pushGameResults").mockRejectedValue(
      new Error("Network error"),
    );

    await submitGameResults(100, "Water");

    expect(window.location.href).toBe("/");
  });
});
