import Item, { RulesType } from "./default-item";

interface CheckersItemRulesType extends RulesType {
  movement: {
    checkersType: "international" | "turkish";
    color: "white" | "black";
    king: boolean;
  };
}

class CheckersItem extends Item {
  checkersType: "international" | "turkish";

  color: "white" | "black";

  king: boolean;

  rules: CheckersItemRulesType;

  constructor(item) {
    super(item);

    this.checkersType = item.checkersType || "international";
    this.color = item.color || "black";
    this.king = item.king || false;
    this.rules = item.rules || {
      movement:  {
        checkersType: this.checkersType,
        color: this.color,
        king: this.king,
      },
    };
  }
}

export default CheckersItem;
