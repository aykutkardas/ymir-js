import Board from './board';
import useCoord from './utils/useCoord';

class Rules {
  board: Board = null;

  init(board: Board): Rules {
    this.board = board;
    return this;
  }

  getAvaiblableColumn = (id: string): string[] => {
    const [rowId, colId] = useCoord(id);

    const sideColCoords = {
      topColCoord: `${rowId - 1}|${colId}`,
      leftColCoord: `${rowId}|${colId - 1}`,
      rightColCoord: `${rowId}|${colId + 1}`,
      bottomColCoord: `${rowId + 1}|${colId}`,
    };

    return Object.values(sideColCoords)
      .filter((coord) => this.board.isExistCoord(coord));
  };
}

export default Rules;
