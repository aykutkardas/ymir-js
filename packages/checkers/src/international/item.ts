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
      this.movement.angular = true;
      this.movement.stepCount = 9;
    } else {
      const isBlack = this.color === CHECKERS_BLACK;
      this.movement[isBlack ? 'topLeft' : 'bottomLeft'] = true;
      this.movement[isBlack ? 'topRight' : 'bottomRight'] = true;
    }
  }

  // TODO: Write Test
  setKing(): void {
    this.movement = {
      angular: true,
      stepCount: 9,
    };

    this.king = true;
  }
}

export default CheckersItem;
