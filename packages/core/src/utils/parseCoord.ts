const parseCoord = (coord: string): number[] =>
  coord.split('|').map((n) => parseInt(n, 10));

export default parseCoord;
