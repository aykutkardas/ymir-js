import type { Level } from './rules';

// Three small levels made for this demo. Each one is checked to be solvable
// (see levels.test.ts); the numbers are the fewest moves.
export const LEVELS: Level[] = [
  {
    // 14 moves: push each box straight onto its goal.
    name: 'Warm-up',
    map: [
      '########',
      '#      #',
      '# $  . #',
      '#  @   #',
      '# $  . #',
      '#      #',
      '########',
    ],
  },
  {
    // 22 moves: one box has to go around the pillar.
    name: 'Pillars',
    map: [
      '#######',
      '#     #',
      '# #$# #',
      '# . . #',
      '## $ ##',
      ' # @ # ',
      ' ##### ',
    ],
  },
  {
    // 32 moves: three boxes, and the order matters.
    name: 'Storeroom',
    map: [
      '  ######',
      '  #  . #',
      '### $# #',
      '# . $  #',
      '# #$## #',
      '#   .  #',
      '###  @ #',
      '  ######',
    ],
  },
];
