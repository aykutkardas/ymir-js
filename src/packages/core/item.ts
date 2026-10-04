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
  movement: MovementType;
  /** @deprecated Not used by the library. Removed in 1.0. */
  lock: boolean;
  /** @deprecated Selection is UI state; keep it in your app. Removed in 1.0. */
  selected: boolean;
  [key: string]: any;
};

export type ItemOptions<TData = unknown> = Partial<
  Pick<ItemType, 'name' | 'movement' | 'lock' | 'selected'>
> & {
  data?: TData;
  [key: string]: any;
};

class Item<TData = unknown> implements ItemType {
  name: string;

  /** Anything your game wants to keep on the item. */
  data: TData | undefined;

  /** @deprecated Not used by the library. Removed in 1.0. */
  lock = false;

  /** @deprecated Selection is UI state; keep it in your app. Removed in 1.0. */
  selected = false;

  movement: MovementType = {};

  constructor(item: ItemOptions<TData>) {
    this.data = item.data;
    this.name = item.name as string;
    this.lock = item.lock || this.lock;
    this.selected = item.selected || this.selected;
    this.movement = item.movement || this.movement;
  }
}

export default Item;
