/*
Unit tests for ServerCollab_REP module

This module contains unit tests for the server collaboration functions that handle
communication with the backend API. Tests verify proper handling of API requests
and responses for fetching questions and updating game statistics.

The tests verify:
- fetchQuestions correctly handles successful responses
- fetchQuestions handles various filter parameters
- fetchQuestions handles error responses
- pushGameResults correctly updates tree statistics
- pushGameResults validates game types
- pushGameResults handles server errors
*/

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchQuestions, pushGameResults } from '../ServerCalls/ServerCollab_REP';
import type { Question } from '../ServerCalls/ServerCollab_REP';

// Mock fetch globally
globalThis.fetch = vi.fn();

describe('fetchQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('fetches questions successfully with default parameters', async () => {
    const mockQuestions: Question[] = [
      {
        questionID: 'q1',
        text: 'What is water?',
        type: 'MCQ',
        difficulty: 1,
        resourceType: 'water',
        choices: [
          { text: 'H2O', isCorrect: true },
          { text: 'CO2', isCorrect: false }
        ]
      },
      {
        questionID: 'q2',
        text: 'What is soil made of?',
        type: 'MCQ',
        difficulty: 2,
        resourceType: 'earth',
        choices: [
          { text: 'Minerals', isCorrect: true },
          { text: 'Water only', isCorrect: false }
        ]
      }
    ];

    const mockResponse = {
      success: true,
      count: 2,
      questions: mockQuestions
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const questions = await fetchQuestions();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/get-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numQuestions: undefined,
        resourceType: undefined,
        questionType: undefined,
        difficulty: undefined,
      }),
    });
    expect(questions).toEqual(mockQuestions);
    expect(questions).toHaveLength(2);
  });

  test('fetches questions with specified parameters', async () => {
    const mockQuestions: Question[] = [
      {
        questionID: 'q1',
        text: 'What is water?',
        type: 'MCQ',
        difficulty: 1,
        resourceType: 'water',
        choices: [
          { text: 'H2O', isCorrect: true },
          { text: 'CO2', isCorrect: false }
        ]
      }
    ];

    const mockResponse = {
      success: true,
      count: 1,
      questions: mockQuestions
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const questions = await fetchQuestions(5, 'water', 'MCQ', 1);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/get-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numQuestions: 5,
        resourceType: 'water',
        questionType: 'MCQ',
        difficulty: 1,
      }),
    });
    expect(questions).toEqual(mockQuestions);
    expect(questions[0].resourceType).toBe('water');
  });

  test('throws error when fetch fails with network error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    await expect(fetchQuestions()).rejects.toThrow('Failed to fetch questions');
  });

  test('throws error when server returns unsuccessful response', async () => {
    const mockResponse = {
      success: false,
      count: 0,
      questions: []
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(fetchQuestions()).rejects.toThrow('Server returned unsuccessful response');
  });

  test('fetches empty questions array when no questions match filters', async () => {
    const mockResponse = {
      success: true,
      count: 0,
      questions: []
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const questions = await fetchQuestions(10, 'sun', 'MCQ', 5);

    expect(questions).toEqual([]);
    expect(questions).toHaveLength(0);
  });

  test('handles fetch rejection (network error)', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    await expect(fetchQuestions()).rejects.toThrow('Network error');
  });
});

describe('pushGameResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('successfully pushes water game results', async () => {
    const mockResponse = {
      success: true,
      message: 'Stat updated successfully'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await pushGameResults(10, 'water');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/update-stat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stat_name: 'water',
        value: 10,
      }),
    });
    expect(result).toBe(true);
  });

  test('successfully pushes earth game results', async () => {
    const mockResponse = {
      success: true,
      message: 'Stat updated successfully'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await pushGameResults(15, 'earth');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/update-stat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stat_name: 'earth',
        value: 15,
      }),
    });
    expect(result).toBe(true);
  });

  test('successfully pushes sun game results', async () => {
    const mockResponse = {
      success: true,
      message: 'Stat updated successfully'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await pushGameResults(20, 'sun');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/update-stat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stat_name: 'sun',
        value: 20,
      }),
    });
    expect(result).toBe(true);
  });

  test('converts uppercase gameType to lowercase', async () => {
    const mockResponse = {
      success: true,
      message: 'Stat updated successfully'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await pushGameResults(5, 'WATER');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/update-stat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stat_name: 'water',
        value: 5,
      }),
    });
  });

  test('throws error for invalid gameType', async () => {
    await expect(pushGameResults(10, 'invalid')).rejects.toThrow(
      'Invalid gameType: invalid. Must be "water", "earth", or "sun"'
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('throws error when fetch fails', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    });

    await expect(pushGameResults(10, 'water')).rejects.toThrow(
      'Failed to update stat: Bad Request'
    );
  });

  test('returns false when server returns success: false', async () => {
    const mockResponse = {
      success: false,
      message: 'Failed to update stat'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await pushGameResults(10, 'water');

    expect(result).toBe(false);
  });

  test('handles negative progress values', async () => {
    const mockResponse = {
      success: true,
      message: 'Stat updated successfully'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await pushGameResults(-5, 'water');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/update-stat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stat_name: 'water',
        value: -5,
      }),
    });
    expect(result).toBe(true);
  });

  test('handles zero progress values', async () => {
    const mockResponse = {
      success: true,
      message: 'Stat updated successfully'
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await pushGameResults(0, 'earth');

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/update-stat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stat_name: 'earth',
        value: 0,
      }),
    });
    expect(result).toBe(true);
  });

  test('handles fetch rejection (network error)', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    await expect(pushGameResults(10, 'water')).rejects.toThrow('Network error');
  });
});
