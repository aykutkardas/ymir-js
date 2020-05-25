function useCoord(coord: string): number[] {
  return coord.split('|').map((n) => parseInt(n, 10));
}

export default useCoord;
