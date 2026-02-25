/*
Unit tests for the Terminal component

Covers: log rendering, command submission, empty/whitespace guard,
and input clearing after submit.
*/

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Terminal } from "../components/Terminal/Terminal";


test("renders all log lines", () => {
  render(<Terminal logs={["Hello", "World"]} onCommand={() => {}} />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
  expect(screen.getByText("World")).toBeInTheDocument();
});

test("renders with empty logs without crashing", () => {
  render(<Terminal logs={[]} onCommand={() => {}} />);
  expect(screen.getByPlaceholderText("Enter command...")).toBeInTheDocument();
});

test("calls onCommand with trimmed input on submit", async () => {
  const user = userEvent.setup();
  const mockOnCommand = vi.fn();
  render(<Terminal logs={[]} onCommand={mockOnCommand} />);

  const input = screen.getByPlaceholderText("Enter command...");
  await user.type(input, "  w  ");
  await user.keyboard("{Enter}");

  expect(mockOnCommand).toHaveBeenCalledWith("w");
  expect(mockOnCommand).toHaveBeenCalledTimes(1);
});

test("does not call onCommand when input is empty", async () => {
  const user = userEvent.setup();
  const mockOnCommand = vi.fn();
  render(<Terminal logs={[]} onCommand={mockOnCommand} />);

  await user.keyboard("{Enter}");

  expect(mockOnCommand).not.toHaveBeenCalled();
});

test("does not call onCommand when input is whitespace only", async () => {
  const user = userEvent.setup();
  const mockOnCommand = vi.fn();
  render(<Terminal logs={[]} onCommand={mockOnCommand} />);

  const input = screen.getByPlaceholderText("Enter command...");
  await user.type(input, "   ");
  await user.keyboard("{Enter}");

  expect(mockOnCommand).not.toHaveBeenCalled();
});

test("clears input after a successful submit", async () => {
  const user = userEvent.setup();
  render(<Terminal logs={[]} onCommand={() => {}} />);

  const input = screen.getByPlaceholderText("Enter command...");
  await user.type(input, "w");
  await user.keyboard("{Enter}");

  expect(input).toHaveValue("");
});
