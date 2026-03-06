/*
Unit tests for the TitleScreen component

This module contains unit tests for the TitleScreen component,
verifying that it renders correctly and handles user interactions.
*/

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { TitleScreen } from "../components/TitleScreen/TitleScreen";


// Renders the play button
test("renders play button", () => {
  render(<TitleScreen onPlay={() => {}} onBack={() => {}} />);

  const playButton = screen.getByRole("button", { name: /play/i });
  expect(playButton).toBeInTheDocument();
});

// Calls onPlay callback when play button is clicked
test("calls onPlay when play button is clicked", async () => {
  const user = userEvent.setup();
  const mockOnPlay = vi.fn();

  render(<TitleScreen onPlay={mockOnPlay} onBack={() => {}} />);

  const playButton = screen.getByRole("button", { name: /play/i });
  await user.click(playButton);

  expect(mockOnPlay).toHaveBeenCalledTimes(1);
});

// Renders the back arrow
test("renders back arrow", () => {
  render(<TitleScreen onPlay={() => {}} onBack={() => {}} />);

  const backArrow = screen.getByAltText(/back arrow/i);
  expect(backArrow).toBeInTheDocument();
});

// Calls onBack callback when back arrow is clicked
test("calls onBack when back arrow is clicked", async () => {
  const user = userEvent.setup();
  const mockOnBack = vi.fn();

  render(<TitleScreen onPlay={() => {}} onBack={mockOnBack} />);

  const backArrow = screen.getByAltText(/back arrow/i);
  await user.click(backArrow);

  expect(mockOnBack).toHaveBeenCalledTimes(1);
});