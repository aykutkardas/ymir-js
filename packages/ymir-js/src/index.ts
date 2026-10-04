// ymir-js: everything in one package. Each part is also published on its
// own: @ymir-js/core, @ymir-js/checkers, @ymir-js/chess, @ymir-js/go and
// @ymir-js/match3.
import { Board, Item, parseCoord } from '@ymir-js/core';
import {
  CheckersGame,
  InternationalBoard,
  InternationalItem,
  TurkishBoard,
  TurkishItem,
} from '@ymir-js/checkers';
import { ChessBoard, ChessGame, ChessPiece } from '@ymir-js/chess';
import { GoBoard, GoGame, GoStone } from '@ymir-js/go';
import { Match3Board, Match3Item } from '@ymir-js/match3';

export * from '@ymir-js/core';
export * from '@ymir-js/checkers';
export * from '@ymir-js/chess';
export * from '@ymir-js/go';
export * from '@ymir-js/match3';

// Grouped exports from earlier versions; they keep working.
export const Core = { Board, Item };
export const Checkers = {
  Turkish: { Board: TurkishBoard, Item: TurkishItem },
  International: { Board: InternationalBoard, Item: InternationalItem },
  Game: CheckersGame,
};
export const Chess = { Board: ChessBoard, Piece: ChessPiece, Game: ChessGame };
export const Go = { Board: GoBoard, Stone: GoStone, Game: GoGame };
export const Match3 = { Board: Match3Board, Item: Match3Item };
export const Utils = { parseCoord };
