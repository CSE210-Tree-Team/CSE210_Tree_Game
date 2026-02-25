/*
Unit tests for the InventorySection component

Covers: all elements rendered, correct counts displayed,
and inline color/weight styles for zero vs non-zero counts.
*/

import { render, screen } from "@testing-library/react";
import { InventorySection } from "../components/Sidebar/InventorySection";
import type { Inventory } from "../types/SoilGame_REP.type";


const emptyInventory: Inventory = {
  Nitrogen: 0,
  Hydrogen: 0,
  Carbon: 0,
  Oxygen: 0,
};


test("renders all 4 elements", () => {
  render(<InventorySection inventory={emptyInventory} />);
  expect(screen.getByText("Nitrogen")).toBeInTheDocument();
  expect(screen.getByText("Hydrogen")).toBeInTheDocument();
  expect(screen.getByText("Carbon")).toBeInTheDocument();
  expect(screen.getByText("Oxygen")).toBeInTheDocument();
});

test("displays correct count for each element", () => {
  const inventory: Inventory = { Nitrogen: 3, Hydrogen: 0, Carbon: 1, Oxygen: 0 };
  render(<InventorySection inventory={inventory} />);
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("1")).toBeInTheDocument();
});

test("element with count > 0 renders with success color and bold weight", () => {
  const inventory: Inventory = { ...emptyInventory, Nitrogen: 2 };
  render(<InventorySection inventory={inventory} />);
  const countSpan = screen.getByText("2");
  expect(countSpan).toHaveStyle({ color: "var(--color-success)", fontWeight: "bold" });
});

test("element with count 0 renders with grey color and normal weight", () => {
  render(<InventorySection inventory={emptyInventory} />);
  const zeroSpans = screen.getAllByText("0");
  zeroSpans.forEach((span) => {
    expect(span).toHaveStyle({ color: "var(--color-grey1)", fontWeight: "normal" });
  });
});
