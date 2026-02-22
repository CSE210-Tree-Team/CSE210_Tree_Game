import {
  type Inventory,
  type ElementType,
} from '../types/Abstract.types';

export function createEmptyInventory(): Inventory {
  // TODO: MAJOR BAD, we need to remove hardcoding here
  return {
    Nitrogen: 0,
    Hydrogen: 0,
    Carbon: 0,
    Oxygen: 0,
  };
}

/** Add an element to inventory */
export function addToInventory(inventory: Inventory, element: ElementType): Inventory {
  return {
    ...inventory,
    [element]: inventory[element] + 1,
  };
}

/** 
 * @param inventory: Current Inventory
 * @param element: Element to be decremented
 * @param amount: Amount to remove (Default = 1)
 * @returns Updated Inventory OR null if amount > inventory[element]
 */
export function removeFromInventory(
  inventory: Inventory,
  element: ElementType,
  amount: number = 1
): Inventory | null {
  if (inventory[element] < amount) return null;
  return {
    ...inventory,
    [element]: inventory[element] - amount,
  };
}