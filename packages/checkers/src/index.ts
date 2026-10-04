// Turkish and International checkers: boards with the full rules, a game
// with turns, undo and draws, and PDN notation for International.
export { default as CheckersBoard } from './board.js';
export { default as TurkishBoard } from './turkish/board.js';
export { default as TurkishItem } from './turkish/item.js';
export { default as InternationalBoard } from './international/board.js';
export { default as InternationalItem } from './international/item.js';
export { default as CheckersGame } from './game.js';
export {
  fromFEN,
  fromSquareNumber,
  parsePDNMove,
  toFEN,
  toPDNMove,
  toSquareNumber,
} from './international/notation.js';
export {
  CHECKERS_BLACK,
  CHECKERS_INTERNATIONAL,
  CHECKERS_TURKISH,
  CHECKERS_WHITE,
} from './constant.js';

export type {
  AttackCoord,
  AttactCoord,
  AutoPlayCallbacks,
  CheckersBoardType,
  CheckersColorType,
  CheckersItemType,
  CheckersMove,
  CheckersPosition,
  CheckersVariant,
  DefendCoord,
  PieceCode,
} from './board.js';
export type { DrawReason, DrawRules, GameOptions, GameStatus, SavedGame } from './game.js';
