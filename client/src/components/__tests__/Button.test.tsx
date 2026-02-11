import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";
import styles from "../Button.module.css";

test("renders button with correct label and variant", () => {
  render(<Button variant="water" label="Play" />);
  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveClass(styles.button);
  expect(btn).toHaveClass(styles.water);
  expect(btn).toHaveTextContent("Play");
});

test("defaults to button", () => {
  render(<Button variant="soil" label="Play" />);
  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toHaveAttribute("type", "button");
});

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

test("disabled prevents clicks", async () => {
  const user = userEvent.setup();
  const handle = vi.fn();
  render(<Button variant="soil" label="Play" disabled onClick={handle} />);

  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toBeDisabled();
  await user.click(btn);
  expect(handle).not.toHaveBeenCalled();
});
