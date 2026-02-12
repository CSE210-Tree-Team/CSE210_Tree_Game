/*
Unit tests for the Popup component

This module contains unit tests for the Popup component, which is a reusable 
component used throughout the client-side application.

The tests verify that the Popup renders correctly with different props, 
that the correct content is displayed based on the screen prop, 
and that the button and instructions list are rendered when the 
corresponding props are provided.
*/

import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Popup } from "../Popup";
import styles from "../Popup.module.css";

// Renders the popup with the correct header, variant classes, and button
test("renders popup with correct header, variant, and button", () => {
  render(
    <Popup
      variant="water"
      screen="start"
      header="Welcome to the Water Game!"
      title="Let's get started"
      buttonText="Play"
    />,
  );
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
    "Welcome to the Water Game!",
  );
  const popup = screen.getByText("Welcome to the Water Game!").closest("div");
  expect(popup).toBeInTheDocument();
  expect(popup).toHaveClass(styles.popup);
  expect(popup).toHaveClass(styles.water);
  const header = screen.getByRole("heading", { level: 2 });
  expect(header).toBeInTheDocument();
  expect(header).toHaveTextContent("Welcome to the Water Game!");
  const btn = screen.getByRole("button", { name: /play/i });
  expect(btn).toBeInTheDocument();
});

// Renders the title for the start screen popup and verifies it is displayed correctly
test("renders title for start screen popup", () => {
  render(
    <Popup
      variant="soil"
      screen="start"
      header="Welcome to the Soil Game!"
      title="Let's get started"
    />,
  );
  const title = screen.getByRole("heading", { level: 1 });
  expect(title).toBeInTheDocument();
  expect(title).toHaveTextContent("Let's get started");
});

// Renders the instructions list for the tutorial screen popup and verifies it is displayed correctly
test("renders popup with instructions list on tutorial screen", () => {
  const instructions = ["Step 1: Do this", "Step 2: Do that"];
  render(
    <Popup
      variant="soil"
      screen="tutorial"
      header="How to Play"
      textList={instructions}
    />,
  );
  const listItems = screen.getAllByRole("listitem");
  expect(listItems).toHaveLength(instructions.length);
  instructions.forEach((instruction, index) => {
    expect(listItems[index]).toHaveTextContent(instruction);
  });
});

// Renders the results list for the end screen popup and verifies it is displayed correctly
test("renders popup with results list on end screen", () => {
  const results = [
    "Points earned: 100",
    "Correct questions: 8",
    "Incorrect questions: 2",
  ];
  render(
    <Popup
      variant="soil"
      screen="end"
      header="Time's Up!"
      textList={results}
    />,
  );
  const listItems = screen.getAllByRole("listitem");
  expect(listItems).toHaveLength(results.length);
  results.forEach((result, index) => {
    expect(listItems[index]).toHaveTextContent(result);
  });
});

// Renders the popup without a button when buttonText is not provided
test("does not render button when buttonText is not provided", () => {
  render(
    <Popup
      variant="soil"
      screen="start"
      header="Welcome to the Soil Game!"
      title="Let's get started"
    />,
  );
  const btn = screen.queryByRole("button");
  expect(btn).not.toBeInTheDocument();
});

// Renders the popup without a list when textList is not provided for tutorial and end screens
test("does not render instructions list when textList is not provided", () => {
  render(<Popup variant="soil" screen="tutorial" header="How to Play" />);
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});
