import { Checkers } from 'ymir-js';

export type Variant = 'turkish' | 'international';
export type Color = 'white' | 'black';

export type Move = {
  from: string;
  path: string[];
  captured: string[];
};

export const VARIANTS: Record<
  Variant,
  { name: string; size: number; checkered: boolean; rules: string[] }
> = {
  turkish: {
    name: 'Turkish',
    size: 8,
    checkered: false,
    rules: [
      'Men move one square forward or sideways and capture the same way.',
      'Kings fly along rows and columns.',
      'Captured pieces leave the board one by one.',
    ],
  },
  international: {
    name: 'International',
    size: 10,
    checkered: true,
    rules: [
      'Men move one square diagonally forward and capture in all four diagonals.',
      'Kings fly along diagonals.',
      'Captured pieces leave the board when the move ends.',
    ],
  },
};

export const SHARED_RULES = [
  'Capturing is mandatory, and you must take the most pieces you can.',
  'A man that ends its move on the far row becomes a king.',
];

export const HUMAN: Color = 'black';
export const COMPUTER: Color = 'white';

export const other = (color: Color): Color =>
  color === 'white' ? 'black' : 'white';

export const createBoard = (variant: Variant) =>
  variant === 'turkish'
    ? new Checkers.Turkish.Board().init()
    : new Checkers.International.Board().init();

export type Board = ReturnType<typeof createBoard>;

export const coordOf = (row: number, col: number) => `${row}|${col}`;

/** The move the computer wants to play, using the library's autoPlay. */
export const pickComputerMove = (board: Board, color: Color): Move | null => {
  const legal: Move[] = board.getLegalMoves(color);
  const steps: string[] = [];

  board.autoPlay(color, {
    onMove: (from, to) => {
      if (!steps.length) steps.push(from);
      steps.push(to);
    },
  });

  const [from, ...path] = steps;
  const match = legal.find(
    (move) => move.from === from && move.path.join() === path.join()
  );

  return match ?? legal[0] ?? null;
};
