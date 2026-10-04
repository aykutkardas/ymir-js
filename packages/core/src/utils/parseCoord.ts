const DIGIT_0 = 48;
const DIGIT_9 = 57;
const MINUS = 45;
const PIPE = 124;

// Longest digit run that adds up exactly in a double, so the fast path
// gives the same number parseInt would.
const MAX_DIGITS = 15;

const parseSlow = (coord: string): number[] =>
  coord.split('|').map((n) => parseInt(n, 10));

/**
 * Parses one `-?\d+` number starting at `start`, stopping at `end`.
 * Returns NaN when the text is anything else, so the caller can fall back.
 */
const parsePart = (coord: string, start: number, end: number): number => {
  const negative = coord.charCodeAt(start) === MINUS;
  const first = negative ? start + 1 : start;

  if (first >= end || end - first > MAX_DIGITS) return NaN;

  let n = 0;

  for (let i = first; i < end; i += 1) {
    const code = coord.charCodeAt(i);
    if (code < DIGIT_0 || code > DIGIT_9) return NaN;
    n = n * 10 + (code - DIGIT_0);
  }

  return negative ? -n : n;
};

/**
 * `"row|col"` to `[row, col]`. Plain coords take a fast path; anything
 * else is parsed as `coord.split('|').map((n) => parseInt(n, 10))`.
 */
const parseCoord = (coord: string): number[] => {
  const pipe = coord.indexOf('|');

  if (pipe !== -1) {
    const row = parsePart(coord, 0, pipe);
    const col = parsePart(coord, pipe + 1, coord.length);

    if (!Number.isNaN(row) && !Number.isNaN(col)) return [row, col];
  }

  return parseSlow(coord);
};

export default parseCoord;
