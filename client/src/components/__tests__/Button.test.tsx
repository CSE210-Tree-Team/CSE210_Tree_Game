/*
Unit tests for the Button component

This module contains unit tests for the Button component, which is a reusable 
component used throughout the client-side application.

The tests verify that the Button renders correctly with different props, 
that the onClick handler is called when the button is clicked, and that the disabled 
state prevents clicks.
*/

import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";
import styles from "../Button.module.css";

// Renders the button with the correct label and variant classes
test("renders button with correct label and variant", () => {
  render(<Button variant="water" label="Play" />);
  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveClass(styles.button);
  expect(btn).toHaveClass(styles.water);
  expect(btn).toHaveTextContent("Play");
});

// Ensures the button has the correct default type attribute
test("defaults to button", () => {
  render(<Button variant="soil" label="Play" />);
  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toHaveAttribute("type", "button");
});

// Ensures the button displays correct onClick behavior
test("renders and calls onClick", async () => {
  const user = userEvent.setup();
  const handle = vi.fn();
  render(<Button variant="water" label="Play" onClick={handle} />);

  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveClass(styles.water); // CSS module class present
  await user.click(btn);
  expect(handle).toHaveBeenCalledTimes(1);
});

// Ensures the disabled state prevents clicks and applies correct styles
test("disabled prevents clicks", async () => {
  const user = userEvent.setup();
  const handle = vi.fn();
  render(<Button variant="soil" label="Play" disabled onClick={handle} />);

  const btn = screen.getByRole("button", { name: /play/i });
    expect(btn).toBeDisabled();

  // Add skipPointerEventsCheck to bypass pointer-events: none in CSS for disabled state
    await user.click(btn, { pointerEventsCheck: 0 });
  expect(handle).not.toHaveBeenCalled();
});
