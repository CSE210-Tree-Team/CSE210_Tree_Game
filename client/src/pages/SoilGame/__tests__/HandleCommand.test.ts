import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoilGame } from '../hooks/useSoilGame';
import type { Node } from '../types/Abstract.types';

// Mock audio system (avoid side effects)
// vi.mock('../AudioSystem', () => ({
//   audioSystem: {
//     playAmbient: vi.fn(),
//     fadeOut: vi.fn(),
//     stopAmbient: vi.fn(),
//   }
// }));

// Mock server call
vi.mock('../../ServerCalls/ServerCalls', () => ({
  pushGameResults: vi.fn().mockResolvedValue(true),
}));

describe('handleCommand - movement & collection', () => {
  function createTestMap(): Node[][] {
    return [
      [
        { x: 0, y: 0, resources: { Nitrogen: 2 }, collected: false },
        { x: 1, y: 0, resources: null, collected: false }
      ],
      [
        { x: 0, y: 1, resources: null, collected: false },
        { x: 1, y: 1, resources: null, collected: false }
      ]
    ];
  }

  function setupPlayingState() {
    const { result } = renderHook(() => useSoilGame());

    act(() => {
      result.current.setPhase('playing');
    });

    act(() => {
      // manually override state
      result.current.state.map = createTestMap();
      result.current.state.playerPosition = { x: 0, y: 0 };
      result.current.state.inventory = { Nitrogen: 0 };
    });

    return result;
  }

  it('moves player north with "w"', () => {
    const result = setupPlayingState();

    act(() => {
      result.current.handleCommand('s'); // move south to y=1
    });

    expect(result.current.state.playerPosition).toEqual({ x: 0, y: 1 });
  });

  it('does not move outside boundaries', () => {
    const result = setupPlayingState();

    act(() => {
      result.current.handleCommand('w'); // already at top boundary
    });

    expect(result.current.state.playerPosition).toEqual({ x: 0, y: 0 });

    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('You cannot move');
  });

  it('collects resources with "c"', () => {
    const result = setupPlayingState();

    act(() => {
      result.current.handleCommand('c');
    });

    expect(result.current.state.inventory.Nitrogen).toBe(2);
    expect(result.current.state.map[0][0].collected).toBe(true);
    expect(
      result.current.state.terminalLog.at(-2)
    ).toContain('Gathered');
  });

  it('logs message when no resources exist', () => {
    const result = setupPlayingState();

    // move to empty tile
    act(() => {
      result.current.handleCommand('s');
    });

    act(() => {
      result.current.handleCommand('c');
    });

    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('There are no resources');
  });
});