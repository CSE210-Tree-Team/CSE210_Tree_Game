import { useState, useCallback, useEffect } from 'react';

import type {
  GameState,
  GamePhase,
  Node,
  Quest,
  Position,
  Inventory,
  ElementType,
  Direction,
  StartGameResponse,
} from '../types/soilGame.types';

import {
  getNextPosition,
  getNodeAt,
  hasUncollectedResource,
  createEmptyInventory,
  addToInventory,
  submitElementToQuest,
  formatLocationInfo,
  getElementSymbol,
  parseCommand,
  isValidCommand,
} from '../utils/gameHelpers';

const MAP_SIZE = 5;
const TOTAL_QUESTS = 4;

