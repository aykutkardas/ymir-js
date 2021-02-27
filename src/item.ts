export type RulesType = {
  movement: {
    angular: boolean;
    linear: boolean;
    stepCount: number;
  };
};

export type ItemType = {
  name: string;
  lock: boolean;
  rules: RulesType;
};

class Item {
  name: string = "anonymous";

  data: any;

  lock: boolean = false;

  rules: RulesType = {
    movement: {
      angular: false,
      linear: true,
      stepCount: 1,
    },
  };

  constructor(item) {
    this.name = item.name || this.name;
    this.lock = item.lock || this.lock;
    this.data = item.data;

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
