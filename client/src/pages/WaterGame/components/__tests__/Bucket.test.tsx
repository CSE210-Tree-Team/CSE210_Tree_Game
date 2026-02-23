/*
Unit tests for the Bucket component

This module contains unit tests for the Bucket component, which is a  
component used throughout the water minigame.

The tests verify that the Bucket renders with the correct styling class and 
that its horizontal position is determined by the left property.
*/

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Bucket from "../Bucket";
import styles from "../Bucket.module.css";

test("renders the bucket image with correct styling", () => {
  render(<Bucket x={0} />);

  const img = screen.getByAltText("Bucket") as HTMLImageElement;
  expect(img.src).toContain("/bucket.svg");
  expect(img).toHaveClass(styles.bucket);
});

test("sets left position based on x prop", () => {
  render(<Bucket x={150} />);

  const img = screen.getByAltText("Bucket");
  expect(img).toHaveStyle({ left: "150px" });
});

test("updates position when x prop changes", () => {
  const { rerender } = render(<Bucket x={50} />);

  let img = screen.getByAltText("Bucket");
  expect(img).toHaveStyle({ left: "50px" });

  rerender(<Bucket x={200} />);
  img = screen.getByAltText("Bucket");
  expect(img).toHaveStyle({ left: "200px" });
});
