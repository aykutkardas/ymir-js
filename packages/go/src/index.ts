// Go: captures, ko, passing, resigning, dead stones and scoring.
export { default as GoBoard, GoStone, otherColor } from './board.js';
export { default as GoGame } from './game.js';

export type { GoColor, GoGroup, GoPosition, GoScore, GoScoringRules, GoStoneType } from './board.js';
export type {
  GoGameOptions,
  GoIllegalReason,
  GoKoRule,
  GoMove,
  GoStatus,
  SavedGoGame,
} from './game.js';
