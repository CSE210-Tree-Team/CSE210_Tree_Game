/*
Unit tests for the Point component

This module contains unit tests for the Point component, which is a  
component used throughout the water minigame.

The tests verify that the Point component renders with the correct 
styling class, text based on the variant, vertical position based on 
the y property, and horizontal position based on the x property.
*/

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Point } from "../Point";
import styles from "../Point.module.css";
import { NUM_POINTS, INCORRECT } from "../../constants";

test("renders point component with styling for correct variant", () => {
  render(<Point id={0} x={0} y={0} variant="correct" />);

  const point = screen.getByTestId("point-0");
  expect(point).toHaveClass(styles.point);

  const pointSpan = point.querySelector("span");
  expect(pointSpan).toHaveClass(styles.correct);
  expect(pointSpan).toHaveTextContent(`+${NUM_POINTS}`);
});

test("renders point component with styling for incorrect variant", () => {
  render(<Point id={0} x={0} y={0} variant="incorrect" />);

  const point = screen.getByTestId("point-0");
  expect(point).toHaveClass(styles.point);

  const pointSpan = point.querySelector("span");
  expect(pointSpan).toHaveClass(styles.incorrect);
  expect(pointSpan).toHaveTextContent(`${INCORRECT}`);
});

test("sets left position based on x prop", () => {
  render(<Point id={0} x={150} y={0} variant="correct" />);

  const point = screen.getByTestId("point-0");
  expect(point).toHaveStyle({ left: "150px" });
});

test("updates position when x prop changes", () => {
  const { rerender } = render(<Point id={0} x={50} y={0} variant="correct" />);

  let point = screen.getByTestId("point-0");
  expect(point).toHaveStyle({ left: "50px" });

  rerender(<Point id={0} x={200} y={0} variant="correct" />);
  point = screen.getByTestId("point-0");
  expect(point).toHaveStyle({ left: "200px" });
});

test("sets top position based on y prop", () => {
  render(<Point id={0} x={0} y={150} variant="correct" />);

  const point = screen.getByTestId("point-0");
  expect(point).toHaveStyle({ top: "150px" });
});

test("updates position when y prop changes", () => {
  const { rerender } = render(<Point id={0} x={0} y={50} variant="correct" />);

  let point = screen.getByTestId("point-0");
  expect(point).toHaveStyle({ top: "50px" });

  rerender(<Point id={0} x={0} y={200} variant="correct" />);
  point = screen.getByTestId("point-0");
  expect(point).toHaveStyle({ top: "200px" });
});
