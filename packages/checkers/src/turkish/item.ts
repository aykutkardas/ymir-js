import { Item, MovementType } from '@ymir-js/core';
import type { CheckersColorType, CheckersItemType } from '../board.js';
import { CHECKERS_BLACK } from '../constant.js';

export type { CheckersColorType, CheckersItemType };

class CheckersItem extends Item implements CheckersItemType {
  color: CheckersColorType;

  king: boolean;

  movement: MovementType = {};

  constructor(item: Partial<CheckersItemType> & { data?: any }) {
    super(item);

    this.color = item.color || CHECKERS_BLACK;
    this.king = item.king || false;
    this.movement = item.movement || {};

    if (item.king) {
      this.movement.linear = true;
      this.movement.stepCount = 7;
    } else {
      const isBlack = this.color === CHECKERS_BLACK;
      this.movement[isBlack ? 'top' : 'bottom'] = true;
      this.movement.left = true;
      this.movement.right = true;
    }
  }

  // TODO: Write Test
  setKing(): void {
    this.movement = {
      linear: true,
      stepCount: 7,
    };

    this.king = true;
  }
}

export default CheckersItem;
