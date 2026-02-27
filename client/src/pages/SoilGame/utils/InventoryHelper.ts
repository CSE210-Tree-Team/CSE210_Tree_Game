import {
  type Inventory,
  type ElementType,
} from '../types/Abstract.types';

export function createEmptyInventory(elementNames: string[] = []): Inventory {
  const inventory: Inventory = {};
  elementNames.forEach(name => {
    inventory[name] = 0;
  });
  return inventory;
}

/** Add an element to inventory */
export function addToInventory(
  inventory: Inventory,
  element: string,
  amount: number = 1
): Inventory {
  return {
    ...inventory,
    [element]: (inventory[element] ?? 0) + amount,
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