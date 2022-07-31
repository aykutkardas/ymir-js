import Item, { ItemType, MovementType } from '../../core/item';
import { CHECKERS_WHITE, CHECKERS_BLACK } from '../constant';

export type CheckersColorType = typeof CHECKERS_BLACK | typeof CHECKERS_WHITE;

export interface CheckersItemType extends ItemType {
  color: CheckersColorType;
  king: boolean;
}

class CheckersItem extends Item implements CheckersItemType {
  color: CheckersColorType;

  king: boolean;

  movement: MovementType = {};

  constructor(item) {
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
