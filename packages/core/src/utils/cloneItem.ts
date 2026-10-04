/** Plain objects and arrays are copied all the way down; anything else is shared. */
const copyValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(copyValue);

  if (value !== null && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);

    if (proto === Object.prototype || proto === null) {
      const copy: Record<string, unknown> = Object.create(proto);
      for (const [key, inner] of Object.entries(value)) copy[key] = copyValue(inner);
      return copy;
    }
  }

  return value;
};

/**
 * A copy of an item that keeps its class: its own fields are copied, with
 * plain objects and arrays (like `data` and `movement`) copied deeply, so
 * changing the copy never changes the original. The constructor is not run.
 */
const cloneItem = <T>(item: T): T => {
  if (item === null || typeof item !== 'object') return item;

  const copy = Object.create(Object.getPrototypeOf(item));
  for (const [key, value] of Object.entries(item)) copy[key] = copyValue(value);

  return copy;
};

export default cloneItem;
