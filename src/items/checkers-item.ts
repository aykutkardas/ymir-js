import Item, { ItemType, RulesType } from "./default-item";
import { CHECKERS_INTERNATIONAL, CHECKERS_TURKISH } from "../rules/constant";

export type CheckersTypeType =
  | typeof CHECKERS_INTERNATIONAL
  | typeof CHECKERS_TURKISH;
export type CheckersColorType = "black" | "white";
export interface CheckersItemType extends ItemType {
  checkersType: CheckersTypeType;
  color: CheckersColorType;
  king: boolean;
}

class CheckersItem extends Item implements CheckersItemType {
  checkersType: CheckersTypeType;

  color: CheckersColorType;

  king: boolean;

  rules: RulesType;

  constructor(item) {
    super(item);

    this.checkersType = item.checkersType || "international";
    this.color = item.color || "black";
    this.king = item.king || false;
    this.rules = item.rules || {};
  }
}

export default CheckersItem;
