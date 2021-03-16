export type RulesType = {
  movement: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    angular: boolean;
    linear: boolean;
    stepCount: number;
  };
};

export type ItemType = {
  name: string;
  lock: boolean;
  selected: boolean;
  rules: RulesType;
};

class Item {
  name: string;

  data: any;

  lock: boolean = false;

  selected: boolean = false;

  rules: RulesType = {
    movement: {
      top: false,
      bottom: false,
      left: false,
      right: false,
      angular: false,
      linear: false,
      stepCount: 1,
    },
  };

  constructor(item) {
    this.data = item.data;
    this.name = item.name || this.name;
    this.lock = item.lock || this.lock;
    this.selected = item.selected || this.selected;

    if (item?.rules?.movement) {
      this.rules = {
        movement: {
          ...this.rules.movement,
          ...item.rules.movement,
        },
      };
    }
  }
}

export default Item;
