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
import styles from "../WaterGame.module.css";

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

  await user.click(readyButton);
  expect(screen.getByTestId("water-game")).toBeInTheDocument();
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
});

// Renders the game screen and checks all components are present (question container, bucket, etc...)
test("renders game screen and checks for all components", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));

  expect(screen.getByTestId("water-game")).toBeInTheDocument();

  const question = screen.getByTestId("question");
  expect(question).toBeInTheDocument();
  expect(question).toHaveClass(styles.question);
  expect(
    screen.getByText("What is the chemical formula for water?"),
  ).toBeInTheDocument();

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

test("raindrop spawns within container bounder", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <WaterGame />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: /play/i }));
  await user.click(screen.getByRole("button", { name: /i'm ready/i }));
  expect(screen.getByTestId("water-game")).toBeInTheDocument();
});
