/*
Unit tests for the InventorySection component

Covers: all elements rendered, correct counts displayed,
and inline color/weight styles for zero vs non-zero counts.
*/

import { render, screen } from "@testing-library/react";
import { InventorySection } from "../components/Sidebar/InventorySection";
import type { Inventory } from "../types/Abstract.types";


const emptyInventory: Inventory = {
  Nitrogen: 0,
  Hydrogen: 0,
  Carbon: 0,
  Oxygen: 0,
};


test("does not render elements with value 0", () => {
  render(<InventorySection inventory={emptyInventory} />);

  expect(screen.queryByText("Nitrogen")).not.toBeInTheDocument();
  expect(screen.queryByText("Hydrogen")).not.toBeInTheDocument();
  expect(screen.queryByText("Carbon")).not.toBeInTheDocument();
  expect(screen.queryByText("Oxygen")).not.toBeInTheDocument();
});

test("displays correct count for each element", () => {
  const inventory: Inventory = { Nitrogen: 3, Hydrogen: 0, Carbon: 1, Oxygen: 0 };
  render(<InventorySection inventory={inventory} inventoryCapacity={10} />);
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("1")).toBeInTheDocument();
});

test("element with count > 0 renders with success color and bold weight", () => {
  const inventory: Inventory = { ...emptyInventory, Nitrogen: 2 };
  render(<InventorySection inventory={inventory} inventoryCapacity={10} />);
  const countSpan = screen.getByText("2");
  expect(countSpan).toHaveStyle({ color: "var(--color-success)", fontWeight: "bold" });
});
