// Chess: every rule, FEN / SAN / UCI / PGN, and a small built-in engine.
export { default as ChessBoard, ChessPiece, fromSquare, toSquare } from './board.js';
export { default as ChessGame, START_FEN } from './game.js';

export type { ChessColor, ChessPieceItemType, ChessPieceType } from './board.js';
export type {
  ChessDrawReason,
  ChessDrawRules,
  ChessMove,
  ChessStatus,
  SavedChessGame,
} from './game.js';
