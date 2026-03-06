import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  type Direction,
  type GameState,
  DIRECTION_LABELS,
} from '../types/Abstract.types';

import { getNextPosition } from '../utils/PositionHelper';
import { formatLocationInfo } from '../utils/QuestListHelper';

export function usePlayerMovement(
  setGameState: Dispatch<SetStateAction<GameState>>,
) {
  const movePlayer = useCallback((direction: Direction) => {
    setGameState((prev) => {
      if (prev.phase !== 'playing') return prev;

      const nextPosition = getNextPosition(prev.playerPosition, direction);

      if (nextPosition == null) {
        return {
          ...prev,
          terminalLog: [
            ...prev.terminalLog,
            '',
            `You cannot move ${DIRECTION_LABELS[direction]}.`,
          ],
        };
      }

      const locationInfo = formatLocationInfo(nextPosition, prev.map);

      return {
        ...prev,
        playerPosition: nextPosition,
        terminalLog: [
          ...prev.terminalLog,
          '',
          `You move ${DIRECTION_LABELS[direction]}.`,
          ...locationInfo,
        ],
      };
    });
  }, [setGameState]);

  return { movePlayer };
}
