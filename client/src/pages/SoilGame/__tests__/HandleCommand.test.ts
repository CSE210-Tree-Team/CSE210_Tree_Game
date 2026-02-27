import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoilGame } from '../hooks/useSoilGame';
import type { Node } from '../types/Abstract.types';

// Mock audio system (avoid side effects)
vi.mock('../AudioSystem', () => ({
  audioSystem: {
    playAmbient: vi.fn(),
    fadeOut: vi.fn(),
    stopAmbient: vi.fn(),
  }
}));

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

  function setupPlayingState(capacity = 5) {
    const { result } = renderHook(() => useSoilGame());

    act(() => {
      result.current.setPhase('playing');
    });

    act(() => {
      // manually override state
      result.current.state.map = createTestMap();
      result.current.state.playerPosition = { x: 0, y: 0 };
      result.current.state.inventory = { Nitrogen: 0 };
      result.current.state.inventoryCapacity = capacity;
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

  it('collects specific resources with "collect Element Amount"', () => {
    const result = setupPlayingState();

    act(() => {
      result.current.handleCommand('collect Nitrogen 1');
    });

    expect(result.current.state.inventory.Nitrogen).toBe(1);
    expect(result.current.state.map[0][0].collected).toBe(false); // Still 1 left
    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('Gathered: 1 Nitrogen.');

    act(() => {
      result.current.handleCommand('collect Nitrogen 1');
    });

    expect(result.current.state.inventory.Nitrogen).toBe(2);
    expect(result.current.state.map[0][0].collected).toBe(true); // Now empty and collected
  });

  it('handles invalid collect parameters gracefully', () => {
    const result = setupPlayingState();

    act(() => {
      result.current.handleCommand('collect Nitrogen 5');
    });

    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('Not enough Nitrogen here to collect that amount.');
  });

  it('logs message when no resources exist', () => {
    const result = setupPlayingState();

    // move to empty tile
    act(() => {
      result.current.handleCommand('s');
    });

    act(() => {
      result.current.handleCommand('collect Nitrogen 1');
    });

    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('There are no resources');
  });

  it('prevents collection if it exceeds inventory capacity', () => {
    // Map has Nitrogen: 2 at (0,0), so this exceeds a capacity of 1
    const result = setupPlayingState(1);

    act(() => {
      result.current.handleCommand('collect Nitrogen 2');
    });

    expect(result.current.state.inventory.Nitrogen).toBe(0); // Did not collect
    expect(result.current.state.map[0][0].collected).toBe(false);
    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('Inventory full!');
  });

  it('drops resources with "drop Element Amount"', () => {
    const result = setupPlayingState();

    // First collect
    act(() => {
      result.current.handleCommand('collect Nitrogen 2');
    });
    expect(result.current.state.inventory.Nitrogen).toBe(2);

    // Then drop
    act(() => {
      result.current.handleCommand('drop Nitrogen 1');
    });

    expect(result.current.state.inventory.Nitrogen).toBe(1);
    expect(
      result.current.state.terminalLog.at(-1)
    ).toContain('Dropped 1 Nitrogen. Space freed.');
  });
});