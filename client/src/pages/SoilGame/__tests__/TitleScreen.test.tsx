/*
Unit tests for the TitleScreen component

This module contains unit tests for the TitleScreen component,
verifying that it renders correctly and handles user interactions.
*/

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { TitleScreen } from "../components/TitleScreen/TitleScreen";

// Renders the title screen with welcome text and game title
test("renders welcome text and game title", () => {
  render(<TitleScreen onPlay={() => {}} />);
  
  expect(screen.getByText("Welcome To")).toBeInTheDocument();
  expect(screen.getByText("DOWN TO")).toBeInTheDocument();
  expect(screen.getByText("THE ROOTS")).toBeInTheDocument();
});

// Renders the play button
test("renders play button", () => {
  render(<TitleScreen onPlay={() => {}} />);
  
  const playButton = screen.getByRole("button", { name: /play/i });
  expect(playButton).toBeInTheDocument();
});

// Calls onPlay callback when play button is clicked
test("calls onPlay when play button is clicked", async () => {
  const user = userEvent.setup();
  const mockOnPlay = vi.fn();
  
  render(<TitleScreen onPlay={mockOnPlay} />);
  
  const playButton = screen.getByRole("button", { name: /play/i });
  await user.click(playButton);
  
  expect(mockOnPlay).toHaveBeenCalledTimes(1);
});