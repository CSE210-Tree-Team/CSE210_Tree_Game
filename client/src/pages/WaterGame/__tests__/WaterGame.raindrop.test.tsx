/*
Integration tests for the raindrop in WaterGame component

This module contains integration tests for the Raindrop component, 
within the WaterGame, which is essential for tracking the player's
progress throughout the minigame. These tests verify the raindrop
animations are as expected: render within horizontal bounds, move
downward over time, spawn at a specified interval, and disappears
once it hits the floor.
*/

import { test, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WaterGame } from "../WaterGame";
import { SPAWN_INTERVAL_MS, RAINDROP_WIDTH } from "../constants";

test("spawns raindrops within container bounds", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  const container = screen.getByTestId("bucket-container");
  Object.defineProperty(container, "offsetWidth", {
    configurable: true,
    value: 500,
  });

  const raindropText = await screen.findByText("H2O", {}, { timeout: 3000 });
  const raindrop = raindropText.closest("div")!;

  const left = parseFloat(raindrop.style.left);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(left).toBeLessThanOrEqual(500 - RAINDROP_WIDTH);
});

test("raindrop moves downward over time", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });

  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  const firstText = await screen.findByText("H2O", {}, { timeout: 3000 });
  const initialTop = parseFloat(firstText.closest("div")!.style.top);

  await waitFor(
    () => {
      const currentText = screen.getByText("H2O");
      const currentTop = parseFloat(currentText.closest("div")!.style.top);

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

  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  expect(screen.queryByTestId("raindrop-0")).not.toBeInTheDocument();

  await screen.findByTestId("raindrop-0", {}, { timeout: SPAWN_INTERVAL_MS });
  expect(screen.queryByTestId("raindrop-1")).not.toBeInTheDocument();

  await screen.findByTestId("raindrop-1", {}, { timeout: SPAWN_INTERVAL_MS });
}, 10000);
