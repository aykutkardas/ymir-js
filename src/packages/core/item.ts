export type MovementType = {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  topLeft?: boolean;
  topRight?: boolean;
  bottomLeft?: boolean;
  bottomRight?: boolean;
  angular?: boolean;
  linear?: boolean;
  stepCount?: number;
};

export type ItemType = {
  name: string;
  lock: boolean;
  selected: boolean;
  movement: MovementType;
  [key: string]: any;
};

class Item implements ItemType {
  name: string;

  data: any;

  lock = false;

  selected = false;

  movement: MovementType = {};

  constructor(item: Partial<ItemType> & { data?: any }) {
    this.data = item.data;
    this.name = item.name as string;
    this.lock = item.lock || this.lock;
    this.selected = item.selected || this.selected;
    this.movement = item.movement || this.movement;
  }
}

export default Item;
