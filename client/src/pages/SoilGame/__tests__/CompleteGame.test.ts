import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoilGame } from '../hooks/useSoilGame';
import { ScoreManager } from '../managers/ScoreManager';

const pushGameResultsMock = vi.fn().mockResolvedValue(true);

vi.mock('../../ServerCalls/ServerCalls', () => ({
  pushGameResults: (...args: any[]) => pushGameResultsMock(...args),
}));

vi.mock('../../../AudioSystem', () => ({
  audioSystem: {
    playAmbient: vi.fn(),
    stopAmbient: vi.fn(),
    fadeOut: vi.fn(),
  },
}));

describe('completeGame', () => {
  beforeEach(() => {
    pushGameResultsMock.mockClear();
  });

  it('calculates progress correctly', () => {
    const manager = new ScoreManager();
    manager.completeQuest();
    manager.completeQuest();
    expect(manager.calculateScore()).toBe(50);
  });

  it('calls pushGameResults with correct progress', async () => {
    const { result } = renderHook(() => useSoilGame());

    // First move to playing phase
    act(() => {
      result.current.setPhase('playing');
    });

    // Set quests completed to 2 (now properly syncs with scoreManager)
    act(() => {
      result.current.setQuestsCompleted(2);
    });

    await act(async () => {
      await result.current.completeGame();
    });

    expect(pushGameResultsMock).toHaveBeenCalledWith(50, 'Earth');
  });
});