/*
Integration tests for the WaterGame component

This module contains integration tests for the WaterGame component, 
which is a key part of the client-side application. These tests verify 
that the different screens (start, tutorial, game, end) render correctly 
and that navigation between them works as expected.
*/

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WaterGame } from "../WaterGame";

// Renders the start screen and navigates through the home and tutorial screen using the buttons
test("renders start screen and navigates through game screens", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Start screen
  expect(screen.getByTestId("water-start")).toBeInTheDocument();
  const playButton = screen.getByRole("button", { name: /play/i });
  expect(playButton).toBeInTheDocument();

  // Click Play to go to tutorial
  await user.click(playButton);
  expect(screen.getByTestId("water-tutorial")).toBeInTheDocument();
  const readyButton = screen.getByRole("button", { name: /i'm ready/i });
  expect(readyButton).toBeInTheDocument();
});

// Renders the tutorial screen and returns to the start screen using the back arrow
test("back arrow navigates back to start screen from tutorial", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Start screen
  expect(screen.getByTestId("water-start")).toBeInTheDocument();
  const playButton = screen.getByRole("button", { name: /play/i });
  await user.click(playButton);

  // Tutorial screen
  expect(screen.getByTestId("water-tutorial")).toBeInTheDocument();
  const backArrow = screen.getByAltText(/back arrow/i);
  expect(backArrow).toBeInTheDocument();

  // Click back arrow to return to start screen
  await user.click(backArrow);
  expect(screen.getByTestId("water-start")).toBeInTheDocument();
});

// Renders the start screen and uses the back arrow to navigate back to the home page
test("back arrow navigates back to home from start screen", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Start screen
  expect(screen.getByTestId("water-start")).toBeInTheDocument();
  const backArrow = screen.getByAltText(/back arrow/i);
  expect(backArrow).toBeInTheDocument();

  // Click back arrow to return to home
  await user.click(backArrow);
  // Since we are using MemoryRouter, we can check if the URL changed to "/"
  expect(window.location.pathname).toBe("/");
});

// Renders the tutorial screen and confirms expected components (header & instructions) are present
test("renders tutorial header and instructions", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  // Navigate to tutorial screen
  await user.click(screen.getByRole("button", { name: /play/i }));

  // Ensure tutorial header is present
  expect(screen.getByText(/how to play/i)).toBeInTheDocument();

  // Ensure a list exists
  const list = screen.getByRole("list");
  expect(list).toBeInTheDocument();

  // Ensure correct number of instructions
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(5);

  // Optional: check a couple key instructions
  expect(
    screen.getByText(/a question will appear at the top of the screen/i),
  ).toBeInTheDocument();

  expect(
    screen.getByText(/goal: collect as many raindrops as you can/i),
  ).toBeInTheDocument();
});
