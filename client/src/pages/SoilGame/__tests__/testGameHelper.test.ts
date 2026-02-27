import { describe, it, expect } from 'vitest';

import {
  type ElementType,
  type GamePhase,
  type Inventory,
  type Position,
  type Node,
  type Quest,
  type GameState,
  type CompleteGameRequest,
  type CompleteGameResponse,
  type Direction,
  type PlayerCommand,
  DIRECTION_DELTAS,
  SYMBOL_TO_ELEMENT,
  DIRECTION_LABELS
} from '../types/Abstract.types';

import {
  getNodeAt,
  hasUncollectedResource,
  generateMap
} from '../utils/MapHelper'

import {
  createEmptyInventory,
  addToInventory,
  removeFromInventory
} from '../utils/InventoryHelper';

import {
  getNextNeededElement,
  checkAndCompleteQuest,
  formatQuestProgress,
  getElementSymbol,
  formatLocationInfo,
  isValidCommand,
  parseCommand
} from '../utils/QuestListHelper';

import {
  isValidPosition,
  getNextPosition,
  getPossibleMoves
} from '../utils/PositionHelper';

/**
 * Vitest (unit tests) for GameHelper implementation.
 */
describe('GameHelper_REP', () => {
  describe('isValidPosition', () => {
    it('should return true for a valid position within bounds', () => {
      expect(isValidPosition({ x: 0, y: 0 }, 5)).toBe(true);
      expect(isValidPosition({ x: 2, y: 3 }, 5)).toBe(true);
      expect(isValidPosition({ x: 4, y: 4 }, 5)).toBe(true);
    });

    it('should return false for a position outside bounds', () => {
      expect(isValidPosition({ x: -1, y: 0 }, 5)).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 }, 5)).toBe(false);
      expect(isValidPosition({ x: 5, y: 0 }, 5)).toBe(false);
      expect(isValidPosition({ x: 0, y: 5 }, 5)).toBe(false);
    });

    it('should use default MAP_SIZE of 5 when mapSize is not provided', () => {
      expect(isValidPosition({ x: 4, y: 4 })).toBe(true);
      expect(isValidPosition({ x: 5, y: 5 })).toBe(false);
    });
  });

  describe('getNextPosition', () => {
    it('should return the correct next position for valid moves', () => {
      const current = { x: 2, y: 2 };
      expect(getNextPosition(current, 'w', 5)).toEqual({ x: 2, y: 1 }); // up
      expect(getNextPosition(current, 'a', 5)).toEqual({ x: 1, y: 2 }); // left
      expect(getNextPosition(current, 's', 5)).toEqual({ x: 2, y: 3 }); // down
      expect(getNextPosition(current, 'd', 5)).toEqual({ x: 3, y: 2 }); // right
    });

    it('should return null when moving outside bounds', () => {
      expect(getNextPosition({ x: 0, y: 0 }, 'w', 5)).toBeNull(); // can't go up
      expect(getNextPosition({ x: 0, y: 0 }, 'a', 5)).toBeNull(); // can't go left
      expect(getNextPosition({ x: 4, y: 4 }, 's', 5)).toBeNull(); // can't go down
      expect(getNextPosition({ x: 4, y: 4 }, 'd', 5)).toBeNull(); // can't go right
    });

    it('should handle moves at all corners', () => {
      // Top-left corner
      expect(getNextPosition({ x: 0, y: 0 }, 's', 5)).toEqual({ x: 0, y: 1 });
      expect(getNextPosition({ x: 0, y: 0 }, 'd', 5)).toEqual({ x: 1, y: 0 });

      // Top-right corner
      expect(getNextPosition({ x: 4, y: 0 }, 's', 5)).toEqual({ x: 4, y: 1 });
      expect(getNextPosition({ x: 4, y: 0 }, 'a', 5)).toEqual({ x: 3, y: 0 });

      // Bottom-left corner
      expect(getNextPosition({ x: 0, y: 4 }, 'w', 5)).toEqual({ x: 0, y: 3 });
      expect(getNextPosition({ x: 0, y: 4 }, 'd', 5)).toEqual({ x: 1, y: 4 });

      // Bottom-right corner
      expect(getNextPosition({ x: 4, y: 4 }, 'w', 5)).toEqual({ x: 4, y: 3 });
      expect(getNextPosition({ x: 4, y: 4 }, 'a', 5)).toEqual({ x: 3, y: 4 });
    });

    it('should use default MAP_SIZE of 5 when mapSize is not provided', () => {
      expect(getNextPosition({ x: 2, y: 2 }, 'w')).toEqual({ x: 2, y: 1 });
      expect(getNextPosition({ x: 0, y: 0 }, 'w')).toBeNull();
      expect(getNextPosition({ x: 4, y: 4 }, 'd')).toBeNull();
    });

    it('should work with different map sizes', () => {
      const mapSize = 10;
      expect(getNextPosition({ x: 5, y: 5 }, 'w', mapSize)).toEqual({ x: 5, y: 4 });
      expect(getNextPosition({ x: 9, y: 9 }, 'd', mapSize)).toBeNull();
      expect(getNextPosition({ x: 9, y: 9 }, 'a', mapSize)).toEqual({ x: 8, y: 9 });
    });
  });

  describe('getPossibleMoves', () => {
    it('should return all direction labels for a center position with all moves available', () => {
      const moves = getPossibleMoves({ x: 2, y: 2 }, 5);
      // expect(moves).toContain('w');
      // expect(moves).toContain('a');
      // expect(moves).toContain('s');
      // expect(moves).toContain('d');
      expect(moves).toContain('Up');
      expect(moves).toContain('Left');
      expect(moves).toContain('Down');
      expect(moves).toContain('Right');
    });

    it('should exclude direction labels for blocked moves at top-left corner', () => {
      const moves = getPossibleMoves({ x: 0, y: 0 }, 5);
      // expect(moves).toContain('s');
      // expect(moves).toContain('d');
      expect(moves).toContain('Down');
      expect(moves).toContain('Right');
      expect(moves).not.toContain('Up');
      expect(moves).not.toContain('Left');
    });

    it('should exclude direction labels for blocked moves at top-right corner', () => {
      const moves = getPossibleMoves({ x: 4, y: 0 }, 5);
      // expect(moves).toContain('s');
      // expect(moves).toContain('a');
      expect(moves).toContain('Down');
      expect(moves).toContain('Left');
      expect(moves).not.toContain('Up');
      expect(moves).not.toContain('Right');
    });

    it('should exclude direction labels for blocked moves at bottom-left corner', () => {
      const moves = getPossibleMoves({ x: 0, y: 4 }, 5);
      // expect(moves).toContain('w');
      // expect(moves).toContain('d');
      expect(moves).toContain('Up');
      expect(moves).toContain('Right');
      expect(moves).not.toContain('Down');
      expect(moves).not.toContain('Left');
    });

    it('should exclude direction labels for blocked moves at bottom-right corner', () => {
      const moves = getPossibleMoves({ x: 4, y: 4 }, 5);
      // expect(moves).toContain('w');
      // expect(moves).toContain('a');
      expect(moves).toContain('Up');
      expect(moves).toContain('Left');
      expect(moves).not.toContain('Down');
      expect(moves).not.toContain('Right');
    });

    it('should use default MAP_SIZE=5 when mapSize is not provided', () => {
      const moves = getPossibleMoves({ x: 2, y: 2 });
      // expect(moves).toContain('w');
      // expect(moves).toContain('a');
      // expect(moves).toContain('s');
      // expect(moves).toContain('d');
      expect(moves).toContain('Up');
      expect(moves).toContain('Right');
      expect(moves).toContain('Down');
      expect(moves).toContain('Left');
    });

    it('should work with different map sizes', () => {
      const moves = getPossibleMoves({ x: 5, y: 5 }, 10);
      expect(moves).toContain('Up');
      expect(moves).toContain('Left');
      expect(moves).toContain('Down');
      expect(moves).toContain('Right');
    });
  });

  describe('getNodeAt', () => {
    const testMap: Node[][] = [
      [
        { x: 0, y: 0, resources: { Nitrogen: 1, Hydrogen: 0, Carbon: 0, Oxygen: 0 }, collected: false },
        { x: 1, y: 0, resources: null, collected: false },
        { x: 2, y: 0, resources: { Nitrogen: 0, Hydrogen: 2, Carbon: 0, Oxygen: 0 }, collected: false },
      ],
      [
        { x: 0, y: 1, resources: null, collected: false },
        { x: 1, y: 1, resources: { Nitrogen: 0, Hydrogen: 0, Carbon: 1, Oxygen: 0 }, collected: false },
        { x: 2, y: 1, resources: null, collected: false },
      ],
      [
        { x: 0, y: 2, resources: { Nitrogen: 0, Hydrogen: 0, Carbon: 0, Oxygen: 1 }, collected: false },
        { x: 1, y: 2, resources: null, collected: true },
        { x: 2, y: 2, resources: null, collected: false },
      ],
    ];

    it('should return the correct node at a valid position', () => {
      const node = getNodeAt(testMap, { x: 0, y: 0 });
      expect(node).toEqual(testMap[0][0]);
      expect(node?.resources?.Nitrogen).toBe(1);
    });

    it('should return nodes with resources', () => {
      const node = getNodeAt(testMap, { x: 1, y: 1 });
      expect(node).toEqual(testMap[1][1]);
      expect(node?.resources?.Carbon).toBe(1);
    });

    it('should return nodes with null resources', () => {
      const node = getNodeAt(testMap, { x: 1, y: 0 });
      expect(node).toEqual(testMap[0][1]);
      expect(node?.resources).toBeNull();
    });

    it('should return null for positions outside map bounds', () => {
      expect(getNodeAt(testMap, { x: 5, y: 5 })).toBeNull();
      expect(getNodeAt(testMap, { x: 10, y: 10 })).toBeNull();
    });

    it('should return null for negative positions', () => {
      expect(getNodeAt(testMap, { x: -1, y: 0 })).toBeNull();
      expect(getNodeAt(testMap, { x: 0, y: -1 })).toBeNull();
      expect(getNodeAt(testMap, { x: -1, y: -1 })).toBeNull();
    });

    it('should handle collected nodes', () => {
      const node = getNodeAt(testMap, { x: 1, y: 2 });
      expect(node).toEqual(testMap[2][1]);
      expect(node?.collected).toBe(true);
    });

    it('should work with different positions in a 3x3 map', () => {
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = getNodeAt(testMap, { x, y });
          expect(node).toEqual(testMap[y][x]);
        }
      }
    });
  });

  describe('hasUncollectedResource', () => {
    it('returns true when the node has resources and is not collected', () => {
      const map: Node[][] = [
        [
          { x: 0, y: 0, resources: { Nitrogen: 1, Hydrogen: 0, Carbon: 0, Oxygen: 0 }, collected: false },
        ],
      ];
      expect(hasUncollectedResource(map, { x: 0, y: 0 })).toBe(true);
    });

    it('returns false when the node has null resources', () => {
      const map: Node[][] = [
        [
          { x: 0, y: 0, resources: null, collected: false },
        ],
      ];
      expect(hasUncollectedResource(map, { x: 0, y: 0 })).toBe(false);
    });

    it('returns false when the node has resources but is already collected', () => {
      const map: Node[][] = [
        [
          { x: 0, y: 0, resources: { Nitrogen: 0, Hydrogen: 1, Carbon: 0, Oxygen: 0 }, collected: true },
        ],
      ];
      expect(hasUncollectedResource(map, { x: 0, y: 0 })).toBe(false);
    });

    it('returns false for positions outside the map bounds', () => {
      const map: Node[][] = [
        [
          { x: 0, y: 0, resources: { Nitrogen: 1, Hydrogen: 0, Carbon: 0, Oxygen: 0 }, collected: false },
        ],
      ];
      expect(hasUncollectedResource(map, { x: 5, y: 5 })).toBe(false);
      expect(hasUncollectedResource(map, { x: -1, y: 0 })).toBe(false);
    });
  });

  describe('generateMap', () => {
    it('generates a DEFAULT = 5 x 5 size map', () => {
      const questList: Quest[] = [
        { moleculeName: "Water", moleculeFormula: "H2O", required: { "H": 2, "O": 1 }, submitted: {}, completed: false }
      ];
      const map: Node[][] = generateMap(questList);
      expect(map.length).toBe(5);
      expect(map[0].length).toBe(5);
    });
  });

  describe('createEmptyInventory', () => {
    it('creates an inventory with all counts zero', () => {
      const inv = createEmptyInventory(['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen']);
      expect(inv.Nitrogen).toBe(0);
      expect(inv.Hydrogen).toBe(0);
      expect(inv.Carbon).toBe(0);
      expect(inv.Oxygen).toBe(0);
    });
  });

  describe('addToInventory', () => {
    it('increments the specified element by one', () => {
      const inv = createEmptyInventory(['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen']);
      const updated = addToInventory(inv, 'Hydrogen');
      expect(updated.Hydrogen).toBe(1);
      expect(updated.Nitrogen).toBe(0);
      expect(updated.Carbon).toBe(0);
      expect(updated.Oxygen).toBe(0);
    });
  });

  describe('removeFromInventory', () => {
    it('decrements the specified element when enough is available', () => {
      const inv = createEmptyInventory(['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen']);
      const withItem = addToInventory(inv, 'Carbon'); // Carbon = 1
      const after = removeFromInventory(withItem, 'Carbon');
      expect(after).not.toBeNull();
      expect(after?.Carbon).toBe(0);
    });

    it('returns null when trying to remove more than available', () => {
      const inv = createEmptyInventory(['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen']);
      expect(removeFromInventory(inv, 'Nitrogen')).toBeNull();
    });

    it('supports removing a custom amount when sufficient', () => {
      let inv = createEmptyInventory(['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen']);
      inv = addToInventory(inv, 'Oxygen');
      inv = addToInventory(inv, 'Oxygen'); // Oxygen = 2
      const after = removeFromInventory(inv, 'Oxygen', 2);
      expect(after).not.toBeNull();
      expect(after?.Oxygen).toBe(0);
    });
  });

  describe('getNextNeededElement', () => {
    it('returns the next needed element and remaining count', () => {
      const quest: Quest = { moleculeName: 'Test', moleculeFormula: '', required: { Nitrogen: 1, Hydrogen: 2 }, submitted: { Nitrogen: 0, Hydrogen: 1 }, completed: false };
      const next = getNextNeededElement(quest);
      expect(next).not.toBeNull();
      expect(next?.element).toBe('Nitrogen');
      expect(next?.remaining).toBe(1);
    });

    it('returns null when quest is complete', () => {
      const quest: Quest = { moleculeName: 'Done', moleculeFormula: '', required: { Carbon: 1 }, submitted: { Carbon: 1 }, completed: true };
      expect(getNextNeededElement(quest)).toBeNull();
    });
  });

  describe('checkAndCompleteQuest', () => {
    it('successfully completes a quest when elements are exactly sufficient', () => {
      const quest: Quest = { moleculeName: 'Water', moleculeFormula: 'H2O', required: { H: 2, O: 1 }, submitted: { H: 0, O: 0 }, completed: false };
      const inventory = { Hydrogen: 2, Oxygen: 1, Carbon: 0, Nitrogen: 0 } as Inventory;
      const result = checkAndCompleteQuest(quest, inventory);

      expect(result).not.toBeNull();
      expect(result?.updatedQuest.completed).toBe(true);
      expect(result?.updatedInventory.Hydrogen).toBe(0);
      expect(result?.updatedInventory.Oxygen).toBe(0);
    });

    it('returns null when items are insufficient', () => {
      const quest: Quest = { moleculeName: 'Water', moleculeFormula: 'H2O', required: { H: 2, O: 1 }, submitted: { H: 0, O: 0 }, completed: false };
      const inventory = { Hydrogen: 1, Oxygen: 1 } as Inventory;
      const result = checkAndCompleteQuest(quest, inventory);
      expect(result).toBeNull();
    });
  });

  // ========================
  // (TESTs) Terminal Log Helpers
  // ========================
  describe('getElementSymbol', () => {
    it('returns the correct chemical symbol for an element', () => {
      expect(getElementSymbol('Nitrogen')).toBe('N');
      expect(getElementSymbol('Hydrogen')).toBe('H');
      expect(getElementSymbol('Carbon')).toBe('C');
      expect(getElementSymbol('Oxygen')).toBe('O');
    });
  });

  // TODO: Insert test when we develop formatLocationInfo
  // describe('formatLocationInfo', () => {});
  describe('formatQuestProgress', () => {
    it('formats quest progress as submitted/required pairs', () => {
      const quest: Quest = { moleculeName: 'X', moleculeFormula: '', required: { Nitrogen: 1, Hydrogen: 2 }, submitted: { Nitrogen: 1, Hydrogen: 1 }, completed: false };
      const formatted = formatQuestProgress(quest);
      expect(formatted).toBe('1/1 Nitrogen, 1/2 Hydrogen');
    });
  });

  describe('isValidCommand', () => {
    it('validates allowed commands and rejects others', () => {
      expect(isValidCommand('w')).toBe(true);
      expect(isValidCommand('W')).toBe(true);
      expect(isValidCommand('collect Nitrogen 1')).toBe(true);
      expect(isValidCommand('drop Nitrogen 1')).toBe(true);
      expect(isValidCommand('foo')).toBe(false);
      expect(isValidCommand('collect')).toBe(false);
    });
  });

  describe('parseCommand', () => {
    it('normalizes and trims input', () => {
      expect(parseCommand('Collect Nitrogen 1')).toBe('collect nitrogen 1');
      expect(parseCommand(' w ')).toBe('w');
    });
  });
});
