import { test, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WaterGame } from "../WaterGame";

const RAINDROP_WIDTH = 96; // 6rem

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

  // Enter game screen
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
