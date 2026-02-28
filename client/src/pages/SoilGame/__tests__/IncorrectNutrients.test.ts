import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoilGame } from '../hooks/useSoilGame';
import { toSoilQuest } from '../utils/QuestionAdapter';
import { generateMap } from '../utils/MapHelper';
import type { Question } from '../../ServerCalls/ServerCalls';
import type { Quest, Node } from '../types/Abstract.types';

// Mock server calls
vi.mock('../../ServerCalls/ServerCalls', () => ({
  pushGameResults: vi.fn().mockResolvedValue(true),
  fetchQuestions: vi.fn(),
}));

describe('Incorrect Nutrients Feature', () => {
  describe('Question Parsing - Incorrect Options', () => {
    it('parses Water/H2O with incorrect Fe option', () => {
      const question: Question = {
        questionID: 'q1',
        text: 'Water/H2O',
        type: 'MultiSelect',
        difficulty: 1,
        resourceType: 'Earth',
        choices: [
          { text: '2H', isCorrect: true },
          { text: 'O', isCorrect: true },
          { text: '2Fe', isCorrect: false },
        ],
      };

      const quest = toSoilQuest(question);

      expect(quest).not.toBeNull();
      expect(quest?.required).toEqual({ H: 2, O: 1 });
      expect(quest?.incorrect).toEqual({ Fe: 2 });
    });

    it('parses Carbon Dioxide/CO2 with incorrect H option', () => {
      const question: Question = {
        questionID: 'q2',
        text: 'Carbon Dioxide/CO2',
        type: 'MultiSelect',
        difficulty: 1,
        resourceType: 'Earth',
        choices: [
          { text: 'C', isCorrect: true },
          { text: '2O', isCorrect: true },
          { text: 'H', isCorrect: false },
        ],
      };

      const quest = toSoilQuest(question);

      expect(quest).not.toBeNull();
      expect(quest?.required).toEqual({ C: 1, O: 2 });
      expect(quest?.incorrect).toEqual({ H: 1 });
    });

    it('parses Ammonia/NH3 with incorrect O option', () => {
      const question: Question = {
        questionID: 'q3',
        text: 'Ammonia/NH3',
        type: 'MultiSelect',
        difficulty: 1,
        resourceType: 'Earth',
        choices: [
          { text: 'N', isCorrect: true },
          { text: '3H', isCorrect: true },
          { text: 'O', isCorrect: false },
        ],
      };

      const quest = toSoilQuest(question);

      expect(quest).not.toBeNull();
      expect(quest?.required).toEqual({ N: 1, H: 3 });
      expect(quest?.incorrect).toEqual({ O: 1 });
    });

    it('accumulates multiple incorrect choices with same element', () => {
      const question: Question = {
        questionID: 'q4',
        text: 'Test/T',
        type: 'MultiSelect',
        difficulty: 1,
        resourceType: 'Earth',
        choices: [
          { text: 'H', isCorrect: true },
          { text: '2Fe', isCorrect: false },
          { text: '3Fe', isCorrect: false },
        ],
      };

      const quest = toSoilQuest(question);

      expect(quest).not.toBeNull();
      expect(quest?.required).toEqual({ H: 1 });
      expect(quest?.incorrect).toEqual({ Fe: 5 }); // 2 + 3 = 5
    });

    it('handles questions with no incorrect choices', () => {
      const question: Question = {
        questionID: 'q5',
        text: 'Simple/S',
        type: 'MultiSelect',
        difficulty: 1,
        resourceType: 'Earth',
        choices: [
          { text: 'H', isCorrect: true },
          { text: 'O', isCorrect: true },
        ],
      };

      const quest = toSoilQuest(question);

      expect(quest).not.toBeNull();
      expect(quest?.required).toEqual({ H: 1, O: 1 });
      expect(quest?.incorrect).toEqual({});
    });
  });

  describe('Required Elements Set Building', () => {
    it('builds set with all required elements from multiple quests', () => {
      const quests: Quest[] = [
        {
          moleculeName: 'Water',
          moleculeFormula: 'H2O',
          required: { H: 2, O: 1 },
          submitted: {},
          completed: false,
          incorrect: { Fe: 2 },
        },
        {
          moleculeName: 'Carbon Dioxide',
          moleculeFormula: 'CO2',
          required: { C: 1, O: 2 },
          submitted: {},
          completed: false,
          incorrect: { H: 1 },
        },
        {
          moleculeName: 'Ammonia',
          moleculeFormula: 'NH3',
          required: { N: 1, H: 3 },
          submitted: {},
          completed: false,
          incorrect: { O: 1 },
        },
      ];

      // Extract required elements (simulating the logic in startGame)
      const requiredElements = new Set<string>();
      const SYMBOL_TO_ELEMENT: Record<string, string> = {
        H: 'Hydrogen',
        O: 'Oxygen',
        C: 'Carbon',
        N: 'Nitrogen',
        Fe: 'Iron',
      };

      quests.forEach((quest) => {
        Object.keys(quest.required).forEach((symbol) => {
          const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
          requiredElements.add(elementName);
        });
      });

      expect(requiredElements.has('Hydrogen')).toBe(true);
      expect(requiredElements.has('Oxygen')).toBe(true);
      expect(requiredElements.has('Carbon')).toBe(true);
      expect(requiredElements.has('Nitrogen')).toBe(true);
      expect(requiredElements.has('Iron')).toBe(false); // Only in incorrect
    });

    it('does not include incorrect-only elements in required set', () => {
      const quests: Quest[] = [
        {
          moleculeName: 'Test1',
          moleculeFormula: 'T1',
          required: { H: 1 },
          submitted: {},
          completed: false,
          incorrect: { Fe: 2, Cl: 1 },
        },
        {
          moleculeName: 'Test2',
          moleculeFormula: 'T2',
          required: { O: 1 },
          submitted: {},
          completed: false,
          incorrect: { Na: 1 },
        },
      ];

      const requiredElements = new Set<string>();
      const SYMBOL_TO_ELEMENT: Record<string, string> = {
        H: 'Hydrogen',
        O: 'Oxygen',
        Fe: 'Iron',
        Cl: 'Chlorine',
        Na: 'Sodium',
      };

      quests.forEach((quest) => {
        Object.keys(quest.required).forEach((symbol) => {
          const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
          requiredElements.add(elementName);
        });
      });

      expect(requiredElements.has('Hydrogen')).toBe(true);
      expect(requiredElements.has('Oxygen')).toBe(true);
      expect(requiredElements.has('Iron')).toBe(false);
      expect(requiredElements.has('Chlorine')).toBe(false);
      expect(requiredElements.has('Sodium')).toBe(false);
    });
  });

  describe('Cross-Quest Element Handling', () => {
    it('allows collection of element that is incorrect in one quest but required in another', () => {
      // Scenario: H is incorrect in Quest1 (CO2) but required in Quest2 (H2O)
      const { result } = renderHook(() => useSoilGame());

      act(() => {
        result.current.setPhase('playing');
      });

      // Manually set up game state with two quests
      act(() => {
        const testQuests: Quest[] = [
          {
            moleculeName: 'Carbon Dioxide',
            moleculeFormula: 'CO2',
            required: { C: 1, O: 2 },
            submitted: {},
            completed: false,
            incorrect: { H: 2 }, // H is incorrect here
          },
          {
            moleculeName: 'Water',
            moleculeFormula: 'H2O',
            required: { H: 2, O: 1 }, // H is required here
            submitted: {},
            completed: false,
            incorrect: { N: 1 },
          },
        ];

        const testMap: Node[][] = [
          [
            { x: 0, y: 0, resources: { Hydrogen: 2 }, collected: false },
            { x: 1, y: 0, resources: null, collected: false },
          ],
          [
            { x: 0, y: 1, resources: null, collected: false },
            { x: 1, y: 1, resources: null, collected: false },
          ],
        ];

        result.current.state.map = testMap;
        result.current.state.quests = testQuests;
        result.current.state.playerPosition = { x: 0, y: 0 };
        result.current.state.inventory = { Hydrogen: 0, Oxygen: 0, Carbon: 0, Nitrogen: 0 };
        result.current.state.inventoryCapacity = 10;
        result.current.state.requiredElements = new Set(['Hydrogen', 'Oxygen', 'Carbon']);
        result.current.state.score = 0;
      });

      const initialScore = result.current.state.score;

      // Try to collect Hydrogen - should succeed without penalty
      act(() => {
        result.current.collectResources('Hydrogen', 2);
      });

      expect(result.current.state.inventory.Hydrogen).toBe(2);
      expect(result.current.state.score).toBe(initialScore); // No penalty
      expect(
        result.current.state.terminalLog.some((log) => log.includes('penalty'))
      ).toBe(false);
    });

    it('penalizes element that is only in incorrect fields across all quests', () => {
      const { result } = renderHook(() => useSoilGame());

      act(() => {
        result.current.setPhase('playing');
      });

      act(() => {
        const testQuests: Quest[] = [
          {
            moleculeName: 'Water',
            moleculeFormula: 'H2O',
            required: { H: 2, O: 1 },
            submitted: {},
            completed: false,
            incorrect: { Fe: 2 }, // Fe is incorrect
          },
          {
            moleculeName: 'Ammonia',
            moleculeFormula: 'NH3',
            required: { N: 1, H: 3 },
            submitted: {},
            completed: false,
            incorrect: { Fe: 1 }, // Fe is incorrect here too
          },
        ];

        const testMap: Node[][] = [
          [
            { x: 0, y: 0, resources: { Iron: 2 }, collected: false },
            { x: 1, y: 0, resources: null, collected: false },
          ],
        ];

        result.current.state.map = testMap;
        result.current.state.quests = testQuests;
        result.current.state.playerPosition = { x: 0, y: 0 };
        result.current.state.inventory = { Hydrogen: 0, Oxygen: 0, Nitrogen: 0, Iron: 0 };
        result.current.state.inventoryCapacity = 10;
        result.current.state.requiredElements = new Set(['Hydrogen', 'Oxygen', 'Nitrogen']);
        result.current.state.score = 0;
      });

      const initialScore = result.current.state.score;

      // Try to collect Iron - should be blocked and penalized
      act(() => {
        result.current.collectResources('Iron', 1);
      });

      expect(result.current.state.inventory.Iron).toBe(0); // Not collected
      expect(result.current.state.score).toBe(initialScore - 5); // -5 penalty
      expect(
        result.current.state.terminalLog.some((log) => log.includes('penalty'))
      ).toBe(true);
      expect(
        result.current.state.terminalLog.some((log) =>
          log.includes('not needed for any quest')
        )
      ).toBe(true);
    });
  });

  describe('Map Generation with Incorrect Elements', () => {
    it('places both required and incorrect elements on map', () => {
      const quests: Quest[] = [
        {
          moleculeName: 'Water',
          moleculeFormula: 'H2O',
          required: { H: 2, O: 1 },
          submitted: {},
          completed: false,
          incorrect: { Fe: 2 },
        },
      ];

      const map = generateMap(quests, 5);

      // Count total resources on map
      let hydrogenCount = 0;
      let oxygenCount = 0;
      let ironCount = 0;

      map.forEach((row: Node[]) => {
        row.forEach((node: Node) => {
          if (node.resources) {
            hydrogenCount += node.resources.Hydrogen || 0;
            oxygenCount += node.resources.Oxygen || 0;
            ironCount += node.resources.Iron || 0;
          }
        });
      });

      // Should have required elements
      expect(hydrogenCount).toBe(2);
      expect(oxygenCount).toBe(1);

      // Should also have incorrect elements
      expect(ironCount).toBe(2);
    });

    it('places all elements from multiple quests including incorrect ones', () => {
      const quests: Quest[] = [
        {
          moleculeName: 'Water',
          moleculeFormula: 'H2O',
          required: { H: 2, O: 1 },
          submitted: {},
          completed: false,
          incorrect: { N: 1 },
        },
        {
          moleculeName: 'Carbon Dioxide',
          moleculeFormula: 'CO2',
          required: { C: 1, O: 2 },
          submitted: {},
          completed: false,
          incorrect: { H: 1 },
        },
      ];

      const map = generateMap(quests, 5);

      let hydrogenCount = 0;
      let oxygenCount = 0;
      let carbonCount = 0;
      let nitrogenCount = 0;

      map.forEach((row: Node[]) => {
        row.forEach((node: Node) => {
          if (node.resources) {
            hydrogenCount += node.resources.Hydrogen || 0;
            oxygenCount += node.resources.Oxygen || 0;
            carbonCount += node.resources.Carbon || 0;
            nitrogenCount += node.resources.Nitrogen || 0;
          }
        });
      });

      // Required elements from both quests: H:2, O:3 (1+2), C:1
      expect(hydrogenCount).toBe(3); // 2 required + 1 incorrect
      expect(oxygenCount).toBe(3); // 1 + 2 required
      expect(carbonCount).toBe(1); // 1 required
      expect(nitrogenCount).toBe(1); // 1 incorrect
    });
  });

  describe('Score Manager Integration', () => {
    it('applies -5 penalty for each incorrect element collection attempt', () => {
      const { result } = renderHook(() => useSoilGame());

      act(() => {
        result.current.setPhase('playing');
      });

      act(() => {
        const testQuests: Quest[] = [
          {
            moleculeName: 'Water',
            moleculeFormula: 'H2O',
            required: { H: 2, O: 1 },
            submitted: {},
            completed: false,
            incorrect: { Fe: 3 },
          },
        ];

        const testMap: Node[][] = [
          [{ x: 0, y: 0, resources: { Iron: 3 }, collected: false }],
        ];

        result.current.state.map = testMap;
        result.current.state.quests = testQuests;
        result.current.state.playerPosition = { x: 0, y: 0 };
        result.current.state.inventory = { Iron: 0 };
        result.current.state.inventoryCapacity = 10;
        result.current.state.requiredElements = new Set(['Hydrogen', 'Oxygen']);
      });

      // Initialize score to 50 by setting 2 completed quests (2 * 25 = 50)
      act(() => {
        result.current.setQuestsCompleted(2);
      });
      expect(result.current.state.score).toBe(50);

      // First attempt
      act(() => {
        result.current.collectResources('Iron', 1);
      });
      expect(result.current.state.score).toBe(45); // 50 - 5

      // Second attempt
      act(() => {
        result.current.collectResources('Iron', 1);
      });
      expect(result.current.state.score).toBe(40); // 45 - 5

      // Third attempt
      act(() => {
        result.current.collectResources('Iron', 1);
      });
      expect(result.current.state.score).toBe(35); // 40 - 5

      // Inventory should still be empty
      expect(result.current.state.inventory.Iron).toBe(0);
    });

    it('does not penalize collection of required elements', () => {
      const { result } = renderHook(() => useSoilGame());

      act(() => {
        result.current.setPhase('playing');
      });

      act(() => {
        const testQuests: Quest[] = [
          {
            moleculeName: 'Water',
            moleculeFormula: 'H2O',
            required: { H: 2, O: 1 },
            submitted: {},
            completed: false,
            incorrect: {},
          },
        ];

        const testMap: Node[][] = [
          [{ x: 0, y: 0, resources: { Hydrogen: 2, Oxygen: 1 }, collected: false }],
        ];

        result.current.state.map = testMap;
        result.current.state.quests = testQuests;
        result.current.state.playerPosition = { x: 0, y: 0 };
        result.current.state.inventory = { Hydrogen: 0, Oxygen: 0 };
        result.current.state.inventoryCapacity = 10;
        result.current.state.requiredElements = new Set(['Hydrogen', 'Oxygen']);
        result.current.state.score = 50;
      });

      // Collect required Hydrogen
      act(() => {
        result.current.collectResources('Hydrogen', 2);
      });
      expect(result.current.state.score).toBe(50); // No penalty

      // Collect required Oxygen
      act(() => {
        result.current.collectResources('Oxygen', 1);
      });
      expect(result.current.state.score).toBe(50); // Still no penalty

      expect(result.current.state.inventory.Hydrogen).toBe(2);
      expect(result.current.state.inventory.Oxygen).toBe(1);
    });
  });

  describe('Complex Multi-Quest Scenarios', () => {
    it('handles realistic 3-quest scenario from questions.json', () => {
      const questions: Question[] = [
        {
          questionID: 'q1',
          text: 'Water/H2O',
          type: 'MultiSelect',
          difficulty: 1,
          resourceType: 'Earth',
          choices: [
            { text: '2H', isCorrect: true },
            { text: 'O', isCorrect: true },
            { text: '2Fe', isCorrect: false },
          ],
        },
        {
          questionID: 'q2',
          text: 'Carbon Dioxide/CO2',
          type: 'MultiSelect',
          difficulty: 1,
          resourceType: 'Earth',
          choices: [
            { text: 'C', isCorrect: true },
            { text: '2O', isCorrect: true },
            { text: 'H', isCorrect: false },
          ],
        },
        {
          questionID: 'q3',
          text: 'Ammonia/NH3',
          type: 'MultiSelect',
          difficulty: 1,
          resourceType: 'Earth',
          choices: [
            { text: 'N', isCorrect: true },
            { text: '3H', isCorrect: true },
            { text: 'O', isCorrect: false },
          ],
        },
      ];

      const quests = questions.map((q) => toSoilQuest(q)).filter((q) => q !== null);

      expect(quests).toHaveLength(3);

      // Check Quest 1 (Water)
      expect(quests[0]?.required).toEqual({ H: 2, O: 1 });
      expect(quests[0]?.incorrect).toEqual({ Fe: 2 });

      // Check Quest 2 (Carbon Dioxide)
      expect(quests[1]?.required).toEqual({ C: 1, O: 2 });
      expect(quests[1]?.incorrect).toEqual({ H: 1 });

      // Check Quest 3 (Ammonia)
      expect(quests[2]?.required).toEqual({ N: 1, H: 3 });
      expect(quests[2]?.incorrect).toEqual({ O: 1 });

      // Build required elements set
      const requiredElements = new Set<string>();
      const SYMBOL_TO_ELEMENT: Record<string, string> = {
        H: 'Hydrogen',
        O: 'Oxygen',
        C: 'Carbon',
        N: 'Nitrogen',
        Fe: 'Iron',
      };

      quests.forEach((quest) => {
        Object.keys(quest.required).forEach((symbol) => {
          const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
          requiredElements.add(elementName);
        });
      });

      // All required elements should be collectible
      expect(requiredElements.has('Hydrogen')).toBe(true); // Required by Q1 & Q3
      expect(requiredElements.has('Oxygen')).toBe(true); // Required by Q1 & Q2
      expect(requiredElements.has('Carbon')).toBe(true); // Required by Q2
      expect(requiredElements.has('Nitrogen')).toBe(true); // Required by Q3

      // Incorrect-only element should NOT be in required set
      expect(requiredElements.has('Iron')).toBe(false); // Only in Q1 incorrect

      // Note: H is incorrect in Q2 but required in Q1 & Q3 - should be collectible
      // Note: O is incorrect in Q3 but required in Q1 & Q2 - should be collectible
    });

    it('correctly identifies collectible vs non-collectible elements in complex scenario', () => {
      const quests: Quest[] = [
        {
          moleculeName: 'Glucose',
          moleculeFormula: 'C6H12O6',
          required: { C: 6, H: 12, O: 6 },
          submitted: {},
          completed: false,
          incorrect: { N: 2, S: 1 },
        },
        {
          moleculeName: 'Sodium Chloride',
          moleculeFormula: 'NaCl',
          required: { Na: 1, Cl: 1 },
          submitted: {},
          completed: false,
          incorrect: { O: 2 },
        },
        {
          moleculeName: 'Methane',
          moleculeFormula: 'CH4',
          required: { C: 1, H: 4 },
          submitted: {},
          completed: false,
          incorrect: { O: 1, Fe: 1 },
        },
      ];

      const SYMBOL_TO_ELEMENT: Record<string, string> = {
        C: 'Carbon',
        H: 'Hydrogen',
        O: 'Oxygen',
        N: 'Nitrogen',
        S: 'Sulfur',
        Na: 'Sodium',
        Cl: 'Chlorine',
        Fe: 'Iron',
      };

      const requiredElements = new Set<string>();
      quests.forEach((quest) => {
        Object.keys(quest.required).forEach((symbol) => {
          const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol;
          requiredElements.add(elementName);
        });
      });

      // Should be collectible (required by at least one quest)
      expect(requiredElements.has('Carbon')).toBe(true);
      expect(requiredElements.has('Hydrogen')).toBe(true);
      expect(requiredElements.has('Oxygen')).toBe(true); // Even though incorrect in Q2 & Q3
      expect(requiredElements.has('Sodium')).toBe(true);
      expect(requiredElements.has('Chlorine')).toBe(true);

      // Should NOT be collectible (only in incorrect fields)
      expect(requiredElements.has('Nitrogen')).toBe(false);
      expect(requiredElements.has('Sulfur')).toBe(false);
      expect(requiredElements.has('Iron')).toBe(false);
    });
  });
});
