import { describe, it, expect } from 'vitest';

import { toSoilQuest } from '../utils/QuestionAdapter';
import type { Question } from '../../ServerCalls/ServerCalls';

type QuestionOverrides = Partial<Question>;

const makeQuestion = (overrides: QuestionOverrides = {}): Question => ({
  questionID: 'q1',
  text: 'Water/H2O',
  type: 'MCQ',
  difficulty: 1,
  resourceType: 'earth',
  choices: [
    { text: '2H', isCorrect: true },
    { text: '1O', isCorrect: true },
    { text: '2Fe', isCorrect: false },
  ],
  ...overrides,
});

describe('QuestionAdapter', () => {
  it('parses earth question text into a Quest', () => {
    const quest = toSoilQuest(makeQuestion());
    expect(quest).not.toBeNull();
    expect(quest?.moleculeName).toBe('Water');
    expect(quest?.moleculeFormula).toBe('H2O');
    expect(quest?.required).toEqual({ H: 2, O: 1 });
    expect(quest?.submitted).toEqual({});
    expect(quest?.completed).toBe(false);
    expect(quest?.incorrect).toEqual({ Fe: 2 });
  });

  it('parses incorrect choices into the incorrect field', () => {
    const quest = toSoilQuest(
      makeQuestion({
        choices: [
          { text: '2H', isCorrect: true },
          { text: '1O', isCorrect: true },
          { text: '3N', isCorrect: false },
          { text: '1C', isCorrect: false },
        ],
      })
    );
    expect(quest).not.toBeNull();
    expect(quest?.required).toEqual({ H: 2, O: 1 });
    expect(quest?.incorrect).toEqual({ N: 3, C: 1 });
  });

  it('accepts resourceType case-insensitively', () => {
    const quest = toSoilQuest(makeQuestion({ resourceType: 'Earth' }));
    expect(quest).not.toBeNull();
  });

  it('trims the name and formula text parts', () => {
    const quest = toSoilQuest(
      makeQuestion({ text: '  Ammonia  /  NH3  ' })
    );
    expect(quest?.moleculeName).toBe('Ammonia');
    expect(quest?.moleculeFormula).toBe('NH3');
  });

  it('defaults element count to 1 when omitted', () => {
    const quest = toSoilQuest(
      makeQuestion({
        choices: [
          { text: 'H', isCorrect: true },
          { text: 'O', isCorrect: true },
        ],
      })
    );
    expect(quest?.required).toEqual({ H: 1, O: 1 });
  });

  it('adds counts when multiple correct choices use same element', () => {
    const quest = toSoilQuest(
      makeQuestion({
        choices: [
          { text: '2H', isCorrect: true },
          { text: '1H', isCorrect: true },
          { text: 'O', isCorrect: true },
        ],
      })
    );
    expect(quest?.required).toEqual({ H: 3, O: 1 });
  });

  it('returns null when resourceType is not earth', () => {
    const quest = toSoilQuest(makeQuestion({ resourceType: 'water' }));
    expect(quest).toBeNull();
  });

  it('returns null when question text is missing the formula', () => {
    const quest = toSoilQuest(makeQuestion({ text: 'Water' }));
    expect(quest).toBeNull();
  });

  it('returns null when question text has an empty name or formula', () => {
    expect(toSoilQuest(makeQuestion({ text: '/H2O' }))).toBeNull();
    expect(toSoilQuest(makeQuestion({ text: 'Water/' }))).toBeNull();
  });

  it('returns null when choices are missing', () => {
    const quest = toSoilQuest(makeQuestion({ choices: undefined as any }));
    expect(quest).toBeNull();
  });

  it('returns null when no correct choices parse into requirements', () => {
    const quest = toSoilQuest(
      makeQuestion({
        choices: [
          { text: '2Fe', isCorrect: false },
          { text: 'abc', isCorrect: true },
        ],
      })
    );
    expect(quest).toBeNull();
  });

  it('returns null when all correct choices are invalid formats', () => {
    const quest = toSoilQuest(
      makeQuestion({
        choices: [
          { text: '2', isCorrect: true },
          { text: 'H2O', isCorrect: true },
          { text: '2h', isCorrect: true },
        ],
      })
    );
    expect(quest).toBeNull();
  });
});
