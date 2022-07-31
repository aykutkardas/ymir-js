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
