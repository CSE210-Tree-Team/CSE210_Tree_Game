import {
  type Direction,
  type ElementType,
} from './SoilGame_REP.type';


export const SYMBOL_TO_ELEMENT: Record<string, ElementType> = {
  H: 'Hydrogen',
  O: 'Oxygen',
  C: 'Carbon',
  N: 'Nitrogen',
};

/** Direction labels for display */
export const DIRECTION_LABELS: Record<Direction, string> = {
  w: 'Up',
  a: 'Left',
  s: 'Down',
  d: 'Right',
};
// The Sidebar needs to turn full element names (e.g., "Hydrogen") back into symbols (e.g., "H") for the progress display.
export const ELEMENT_TO_SYMBOL: Record<ElementType, string> = {
  Hydrogen: 'H',
  Oxygen: 'O',
  Carbon: 'C',
  Nitrogen: 'N',
};