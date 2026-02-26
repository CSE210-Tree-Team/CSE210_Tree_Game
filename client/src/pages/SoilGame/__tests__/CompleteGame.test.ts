import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoilGame, calculateProgress } from '../hooks/useSoilGame';

const pushGameResultsMock = vi.fn().mockResolvedValue(true);

vi.mock('../../ServerCalls/ServerCalls', () => ({
  pushGameResults: (...args: any[]) => pushGameResultsMock(...args),
}));

// vi.mock('../AudioSystem', () => ({
//   audioSystem: {
//     playAmbient: vi.fn(),
//     fadeOut: vi.fn(),
//     stopAmbient: vi.fn(),
//   }
// }));

describe('completeGame', () => {

  it('calculates progress correctly', () => {
    expect(calculateProgress(2)).toBe(50);
  });

  it('calls pushGameResults with correct progress', async () => {
    const { result } = renderHook(() => useSoilGame());

    // First move to playing phase
    act(() => {
      result.current.setPhase('playing');
    });

    act(() => {
        result.current.setQuestsCompleted(2);
    });

    await act(async () => {
      await result.current.completeGame();
    });

    expect(pushGameResultsMock).toHaveBeenCalledWith(50, 'earth');
  });

});