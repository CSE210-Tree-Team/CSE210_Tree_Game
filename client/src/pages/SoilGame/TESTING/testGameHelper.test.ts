import { describe, it, expect } from 'vitest';
import { 
  isValidPosition,
  getNextPosition,
  getPossibleMoves,
  getNodeAt,
  hasUncollectedResource,
  createEmptyInventory
} from '../utils/GameHelper_REP';

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
      expect(moves).toContain('w');
      expect(moves).toContain('a');
      expect(moves).toContain('s');
      expect(moves).toContain('d');
      expect(moves).toContain('Up');
      expect(moves).toContain('Left');
      expect(moves).toContain('Down');
      expect(moves).toContain('Right');
    });

    it('should exclude direction labels for blocked moves at top-left corner', () => {
      const moves = getPossibleMoves({ x: 0, y: 0 }, 5);
      expect(moves).toContain('s');
      expect(moves).toContain('d');
      expect(moves).toContain('Down');
      expect(moves).toContain('Right');
      expect(moves).not.toContain('Up');
      expect(moves).not.toContain('Left');
    });

    it('should exclude direction labels for blocked moves at top-right corner', () => {
      const moves = getPossibleMoves({ x: 4, y: 0 }, 5);
      expect(moves).toContain('s');
      expect(moves).toContain('a');
      expect(moves).toContain('Down');
      expect(moves).toContain('Left');
      expect(moves).not.toContain('Up');
      expect(moves).not.toContain('Right');
    });

    it('should exclude direction labels for blocked moves at bottom-left corner', () => {
      const moves = getPossibleMoves({ x: 0, y: 4 }, 5);
      expect(moves).toContain('w');
      expect(moves).toContain('d');
      expect(moves).toContain('Up');
      expect(moves).toContain('Right');
      expect(moves).not.toContain('Down');
      expect(moves).not.toContain('Left');
    });

    it('should exclude direction labels for blocked moves at bottom-right corner', () => {
      const moves = getPossibleMoves({ x: 4, y: 4 }, 5);
      expect(moves).toContain('w');
      expect(moves).toContain('a');
      expect(moves).toContain('Up');
      expect(moves).toContain('Left');
      expect(moves).not.toContain('Down');
      expect(moves).not.toContain('Right');
    });

    it('should use default MAP_SIZE when mapSize is not provided', () => {
      const moves = getPossibleMoves({ x: 2, y: 2 });
      expect(moves).toContain('w');
      expect(moves).toContain('a');
      expect(moves).toContain('s');
      expect(moves).toContain('d');
    });

    it('should work with different map sizes', () => {
      const moves = getPossibleMoves({ x: 5, y: 5 }, 10);
      expect(moves).toContain('w');
      expect(moves).toContain('a');
      expect(moves).toContain('s');
      expect(moves).toContain('d');
      expect(moves).toContain('Up');
      expect(moves).toContain('Left');
      expect(moves).toContain('Down');
      expect(moves).toContain('Right');
    });
  });

  describe('getNodeAt', () => {
    const testMap: typeof Node[][] = [
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

  // describe('hasUncollectedResource ', () => {});
});
