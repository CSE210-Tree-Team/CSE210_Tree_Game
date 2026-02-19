/*
Unit tests for the Raindrop component

This module contains unit tests for the Raindrop component, which is a  
component used throughout the water minigame to display answer choices 
to the player.

The tests verify that the Raindrop renders with the correct styling class, 
corresponding answer text, horizontal position determined by the x property,
and vertical position determined by the y property.
*/

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Raindrop } from "../Raindrop";
import styles from "../Raindrop.module.css";

test("renders the raindrop with correct styling and answer text", () => {
  render(<Raindrop x={0} y={0} answer={"answer"} />);
  const raindrop = screen.getByText("answer").closest("div");
  expect(raindrop).toBeInTheDocument();
  expect(raindrop).toHaveClass(styles.raindrop);

  const answer = screen.getByText("answer");
  expect(answer).toBeInTheDocument();
  expect(answer).toHaveClass(styles.answer);
});

test("sets left position based on x prop", () => {
  render(<Raindrop x={150} y={0} answer={"answer"} />);

  const raindrop = screen.getByText("answer").closest("div");
  expect(raindrop).toHaveStyle({ left: "150px" });
});

test("updates position when x prop changes", () => {
  const { rerender } = render(<Raindrop x={150} y={0} answer={"answer"} />);

  let raindrop = screen.getByText("answer").closest("div");
  expect(raindrop).toHaveStyle({ left: "150px" });

  rerender(<Raindrop x={200} y={0} answer={"answer"} />);
  raindrop = screen.getByText("answer").closest("div");
  expect(raindrop).toHaveStyle({ left: "200px" });
});

test("updates position when y prop changes", () => {
  const { rerender } = render(<Raindrop x={0} y={0} answer={"answer"} />);

  let raindrop = screen.getByText("answer").closest("div");
  expect(raindrop).toHaveStyle({ top: "0px" });

  rerender(<Raindrop x={0} y={200} answer={"answer"} />);
  raindrop = screen.getByText("answer").closest("div");
  expect(raindrop).toHaveStyle({ top: "200px" });
});
