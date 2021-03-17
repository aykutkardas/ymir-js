import Item, { ItemType, RulesType } from "./default-item";

export type CheckersColorType = "black" | "white";
export interface CheckersItemType extends ItemType {
  color: CheckersColorType;
  king: boolean;
}

class CheckersItem extends Item implements CheckersItemType {
  color: CheckersColorType;

  king: boolean;

  rules: RulesType;

  constructor(item) {
    super(item);

    this.color = item.color || "black";
    this.king = item.king || false;
    this.rules = item.rules || {};
  }
}

export default CheckersItem;
