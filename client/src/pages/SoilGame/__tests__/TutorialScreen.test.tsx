/*
Unit tests for the TutorialScreen component

This module contains unit tests for the TutorialScreen component,
verifying that it renders tutorial instructions correctly and handles
user interactions.
*/

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorialScreen } from "../components/TutorialScreen/TutorialScreen";
import { vi } from "vitest";

// Renders the tutorial header
test("renders tutorial header", () => {
  render(<TutorialScreen onReady={() => {}} />);
  
  expect(screen.getByText(/how to play/i)).toBeInTheDocument();
});

// Renders all tutorial instructions
test("renders all tutorial instructions", () => {
  render(<TutorialScreen onReady={() => {}} />);
  
  expect(screen.getByText(/you are in a dungeon underground/i)).toBeInTheDocument();
  expect(screen.getByText(/each room may contain an answer/i)).toBeInTheDocument();
  expect(screen.getByText(/type the number of the correct/i)).toBeInTheDocument();
  expect(screen.getByText(/collect the answers to all 3 quests/i)).toBeInTheDocument();
});

// Renders the ready button
test("renders ready button", () => {
  render(<TutorialScreen onReady={() => {}} />);
  
  const readyButton = screen.getByRole("button", { name: /i'm ready/i });
  expect(readyButton).toBeInTheDocument();
});

// Calls onReady callback when ready button is clicked
test("calls onReady when ready button is clicked", async () => {
  const user = userEvent.setup();
  const mockOnReady = vi.fn();
  
  render(<TutorialScreen onReady={mockOnReady} />);
  
  const readyButton = screen.getByRole("button", { name: /i'm ready/i });
  await user.click(readyButton);
  
  expect(mockOnReady).toHaveBeenCalledTimes(1);
});

// Renders correct number of instructions
test("renders correct number of instructions", () => {
  render(<TutorialScreen onReady={() => {}} />);
  
  const list = screen.getByRole("list");
  expect(list).toBeInTheDocument();
  
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(4);
});