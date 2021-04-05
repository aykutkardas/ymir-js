export type MovementType = {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
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

class Item {
  name: string;

  data: any;

  lock: boolean = false;

  selected: boolean = false;

  movement: MovementType = {};

  constructor(item) {
    this.data = item.data;
    this.name = item.name || this.name;
    this.lock = item.lock || this.lock;
    this.selected = item.selected || this.selected;
    this.movement = item.movement || this.movement;
  }
}

export default Item;
