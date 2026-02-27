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
  isQuestComplete,
  getNextNeededElement,
  submitElementToQuest,
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


describe('SoilGame_REP.type exports', () => {
  it('SYMBOL_TO_ELEMENT maps symbols to ElementType', () => {
    expect(SYMBOL_TO_ELEMENT.H).toBe('Hydrogen');
    expect(SYMBOL_TO_ELEMENT.N).toBe('Nitrogen');
    expect(SYMBOL_TO_ELEMENT.C).toBe('Carbon');
    expect(SYMBOL_TO_ELEMENT.O).toBe('Oxygen');
  });

  it('DIRECTION_DELTAS contains all directions with dx/dy', () => {
    const dirs: Direction[] = ['w', 'a', 's', 'd'];
    for (const d of dirs) {
      const delta = DIRECTION_DELTAS[d];
      expect(typeof delta.dx).toBe('number');
      expect(typeof delta.dy).toBe('number');
    }
  });

  it('DIRECTION_LABELS contains expected labels', () => {
    expect(DIRECTION_LABELS.w).toBe('Up');
    expect(DIRECTION_LABELS.a).toBe('Left');
    expect(DIRECTION_LABELS.s).toBe('Down');
    expect(DIRECTION_LABELS.d).toBe('Right');
  });

  it('can construct and inspect a Node and Position', () => {
    const p: Position = { x: 1, y: 2 };
    const node: Node = { x: p.x, y: p.y, resources: { Nitrogen: 0, Hydrogen: 0, Carbon: 0, Oxygen: 0 }, collected: false };
    expect(node.x).toBe(1);
    expect(node.y).toBe(2);
    expect(node.collected).toBe(false);
  });

  it('can create Quest, Inventory and GameState shapes', () => {
    const quest: Quest = { moleculeName: 'Test', moleculeFormula: 'T', required: { Nitrogen: 1 }, submitted: { Nitrogen: 0 }, completed: false };
    const inv: Inventory = { Nitrogen: 0, Hydrogen: 0, Carbon: 0, Oxygen: 0 };
    const state: GameState = {
      phase: 'playing',
      map: [[{ x: 0, y: 0, resources: null, collected: false }]],
      mapSize: 1,
      quests: [quest],
      playerPosition: { x: 0, y: 0 },
      inventory: inv,
      terminalLog: [],
      questsCompleted: 0,
    };
    expect(state.phase).toBe('playing');
    expect(state.mapSize).toBe(1);
    expect(state.quests[0].moleculeName).toBe('Test');
  });

  it('CompleteGameRequest/Response shapes are usable', () => {
    const req: CompleteGameRequest = { quests_completed: 2 };
    const res: CompleteGameResponse = { success: true, progress_added: 5, new_soil_level: 3 };
    expect(req.quests_completed).toBe(2);
    expect(res.success).toBe(true);
  });

  it('Direction and PlayerCommand accept allowed values', () => {
    const d: Direction = 'w';
    const pc1: PlayerCommand = 'c';
    const pc2: PlayerCommand = '1';
    expect(DIRECTION_DELTAS[d]).toBeDefined();
    expect(pc1).toBe('c');
    expect(pc2).toBe('1');
  });
});