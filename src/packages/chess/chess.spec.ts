import { describe, expect, it } from 'vitest';

import { fromSquare, toSquare } from './board.js';
import ChessGame, { START_FEN } from './game.js';

const play = (game: ChessGame, ...moves: string[]) => moves.map((m) => game.move(m).san);

describe('squares', () => {
  it('converts between algebraic squares and coords (white at the bottom)', () => {
    expect(fromSquare('a8')).to.equal('0|0');
    expect(fromSquare('e1')).to.equal('7|4');
    expect(toSquare('6|4')).to.equal('e2');
    expect(() => fromSquare('i9')).to.throw();
  });
});

describe('perft (standard move-generation test positions)', () => {
  // Reference counts from https://www.chessprogramming.org/Perft_Results.
  const cases: [string, string, number[]][] = [
    ['start', START_FEN, [20, 400, 8902]],
    ['Kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039]],
    ['position 3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
    ['position 4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
    ['position 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486]],
    ['position 6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', [46, 2079]],
  ];

  cases.forEach(([label, fen, counts]) =>
    it(label, () => {
      const game = new ChessGame(fen);
      counts.forEach((count, i) => expect(game.perft(i + 1)).to.equal(count));
      expect(game.fen()).to.equal(new ChessGame(fen).fen()); // perft leaves the position as it was
    })
  );
});

describe('ChessGame', () => {
  it('starts from the standard position', () => {
    const game = new ChessGame();

    expect(game.fen()).to.equal(START_FEN);
    expect(game.turn).to.equal('white');
    expect(game.getLegalMoves()).to.have.length(20);
    expect(game.getLegalMoves('g1').map((m) => m.san).sort()).to.deep.equal(['Nf3', 'Nh3']);
    expect(game.board.getPiece('e1')).to.deep.include({ type: 'k', color: 'white' });
  });

  it('reads and writes FEN', () => {
    const fen = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';

    expect(new ChessGame(fen).fen()).to.equal(fen);
    expect(() => new ChessGame('not a fen')).to.throw();
    expect(() => new ChessGame('8/8/8/8/8/8/8/9 w - - 0 1')).to.throw();
  });

  it('takes moves as squares, SAN or UCI', () => {
    const game = new ChessGame();

    expect(game.move({ from: 'e2', to: 'e4' }).san).to.equal('e4');
    expect(game.move('e7e5').san).to.equal('e5');
    expect(game.move('Nf3')).to.deep.include({ from: 'g1', to: 'f3', uci: 'g1f3' });
    expect(() => game.move('Ke2')).to.throw(/Illegal/); // black to move
    expect(() => game.move({ from: 'e5', to: 'e3' })).to.throw(/Illegal/);
  });

  it('writes SAN with captures, disambiguation, check and mate', () => {
    const game = new ChessGame('8/8/2k5/8/8/4K3/8/R6R w - - 0 1');

    // Both rooks can reach d1: the file tells them apart.
    expect(game.getLegalMoves().map((m) => m.san)).to.include.members(['Rad1', 'Rhd1']);

    expect(new ChessGame('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1').move('Ra8').san).to.equal('Ra8#');
    expect(new ChessGame('7k/8/8/8/8/8/8/R5K1 w - - 0 1').move('Ra8').san).to.equal('Ra8+');
    expect(
      new ChessGame('k7/8/8/8/3p4/8/4P3/K7 w - - 0 1').getLegalMoves('e2').map((m) => m.san)
    ).to.deep.equal(['e3', 'e4']);

    const knights = new ChessGame('k7/8/8/8/8/1N3N2/8/K7 w - - 0 1');
    expect(knights.getLegalMoves().map((m) => m.san)).to.include.members(['Nbd4', 'Nfd4']);

    const rooks = new ChessGame('7k/8/R7/8/8/8/R7/K7 w - - 0 1');
    expect(rooks.getLegalMoves().map((m) => m.san)).to.include.members(['R6a4', 'R2a4']);
  });

  it('castles both ways, and not through check', () => {
    const game = new ChessGame('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

    expect(game.getLegalMoves('e1').map((m) => m.san)).to.include.members(['O-O', 'O-O-O']);

    const castled = game.move('O-O');
    expect(castled.kind).to.equal('castle-king');
    expect(game.board.getPiece('g1')?.type).to.equal('k');
    expect(game.board.getPiece('f1')?.type).to.equal('r');
    expect(game.fen().split(' ')[2]).to.equal('kq');

    expect(game.move('0-0-0').san).to.equal('O-O-O'); // zeros accepted
    expect(game.board.getPiece('d8')?.type).to.equal('r');

    // A black rook on f8 covers f1, so the king may not pass through it.
    const blocked = new ChessGame('1k3r2/8/8/8/8/8/8/R3K2R w KQ - 0 1');
    expect(blocked.getLegalMoves('e1').map((m) => m.san)).not.to.include('O-O');
    expect(blocked.getLegalMoves('e1').map((m) => m.san)).to.include('O-O-O');
  });

  it('loses castling rights when the king or a rook moves or a rook is taken', () => {
    const game = new ChessGame('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

    game.move('Rh2');
    expect(game.fen().split(' ')[2]).to.equal('Qkq');
    game.move('Rxa1');
    expect(game.fen().split(' ')[2]).to.equal('k');
  });

  it('captures en passant only right after the double step', () => {
    // Black's double step lands next to the white pawn on e5.
    const ep = new ChessGame('k7/3p4/8/4P3/8/8/8/K7 b - - 0 1');
    ep.move('d5');

    const capture = ep.getLegalMoves('e5').find((m) => m.kind === 'en-passant')!;
    expect(capture.san).to.equal('exd6');
    ep.move('exd6');
    expect(ep.board.getPiece('d5')).to.equal(null);
    expect(ep.board.getPiece('d6')?.color).to.equal('white');

    const late = new ChessGame('k7/3p4/8/4P3/8/8/8/K7 b - - 0 1');
    late.move('d5');
    late.move('Kb1');
    late.move('Kb8');
    expect(late.getLegalMoves('e5').map((m) => m.kind)).not.to.include('en-passant');
  });

  it('promotes, to a queen unless told otherwise', () => {
    const game = new ChessGame('k7/4P3/8/8/8/8/8/K7 w - - 0 1');

    expect(game.getLegalMoves('e7').map((m) => m.san)).to.deep.equal([
      'e8=Q+',
      'e8=R+',
      'e8=B',
      'e8=N',
    ]);
    expect(game.move({ from: 'e7', to: 'e8' }).promotion).to.equal('q');
    game.undo();
    expect(game.move('e7e8n').promotion).to.equal('n');
    game.undo();
    expect(game.move('e8=R').san).to.equal('e8=R+');
  });

  it("fool's mate is checkmate", () => {
    const game = new ChessGame();
    play(game, 'f3', 'e5', 'g4');

    expect(game.move('Qh4').san).to.equal('Qh4#');
    expect(game.getStatus()).to.deep.equal({ state: 'checkmate', winner: 'black' });
    expect(game.getLegalMoves()).to.deep.equal([]);
    expect(() => game.move('a3')).to.throw(/over/);
  });

  it('reports check while playing', () => {
    const game = new ChessGame();
    play(game, 'e4', 'f6', 'Qh5+');

    expect(game.getStatus()).to.deep.equal({ state: 'playing', check: true });
    expect(game.isCheck()).to.equal(true);
  });

  it('stalemate is a draw', () => {
    const game = new ChessGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');

    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'stalemate' });
  });

  it('insufficient material is a draw', () => {
    const draw = (fen: string) => new ChessGame(fen).getStatus();

    expect(draw('k7/8/8/8/8/8/8/K7 w - - 0 1')).to.deep.include({ reason: 'insufficient-material' });
    expect(draw('k7/8/8/8/8/8/8/KN6 w - - 0 1')).to.deep.include({ reason: 'insufficient-material' });
    expect(draw('kb6/8/8/8/8/8/8/K1B5 w - - 0 1')).to.deep.include({ reason: 'insufficient-material' }); // b8 and c1: same colour
    expect(draw('kb6/8/8/8/8/8/8/KB6 w - - 0 1').state).to.equal('playing'); // b8 and b1: opposite colours
    expect(draw('k7/8/8/8/8/8/8/KNN5 w - - 0 1').state).to.equal('playing');
    expect(draw('k7/8/8/8/8/8/P7/K7 w - - 0 1').state).to.equal('playing');
  });

  it('threefold repetition is a draw, and undo clears it', () => {
    const game = new ChessGame();
    play(game, 'Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1');
    expect(game.getStatus().state).to.equal('playing');

    game.move('Ng8');
    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'repetition' });

    game.undo();
    expect(game.getStatus().state).to.equal('playing');
  });

  it('fifty moves without a pawn move or capture is a draw', () => {
    const game = new ChessGame('k7/8/8/8/8/8/8/K6R w - - 99 80');

    game.move('Rh2');
    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'fifty-move' });
  });

  it('draw rules can be changed', () => {
    const game = new ChessGame('k7/8/8/8/8/8/8/K7 w - - 0 1', {
      drawRules: { insufficientMaterial: false },
    });

    expect(game.getStatus().state).to.equal('playing');
  });

  it('undo restores the position exactly', () => {
    const game = new ChessGame('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    const fens = [game.fen()];

    for (let i = 0; i < 12; i += 1) {
      const moves = game.getLegalMoves();
      game.move(moves[(i * 7) % moves.length].uci);
      fens.push(game.fen());
    }

    for (let i = fens.length - 1; i > 0; i -= 1) {
      expect(game.fen()).to.equal(fens[i]);
      game.undo();
    }

    expect(game.fen()).to.equal(fens[0]);
    expect(game.undo()).to.equal(null);
  });

  it('writes the moves as PGN movetext', () => {
    const game = new ChessGame();
    play(game, 'e4', 'e5', 'Nf3', 'Nc6', 'Bb5');

    expect(game.pgn()).to.equal('1. e4 e5 2. Nf3 Nc6 3. Bb5');

    const fromBlack = new ChessGame('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    play(fromBlack, 'c5', 'Nf3');
    expect(fromBlack.pgn()).to.equal('1... c5 2. Nf3');
  });

  it('saves and restores a game', () => {
    const game = new ChessGame();
    play(game, 'e4', 'd5', 'exd5', 'Qxd5', 'Nc3');

    const restored = ChessGame.fromJSON(JSON.parse(JSON.stringify(game.toJSON())));

    expect(restored.fen()).to.equal(game.fen());
    expect(restored.pgn()).to.equal(game.pgn());
  });

  it('getBestMove finds a mate in one and wins free material', () => {
    const first = () => 0;

    expect(
      new ChessGame('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1').getBestMove({ random: first })?.san
    ).to.equal('Ra8#');
    expect(
      new ChessGame('rnb1kbnr/pppp1ppp/8/4p1q1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 1').getBestMove({
        random: first,
      })?.san
    ).to.equal('Bxg5');
  });

  it('getBestMove avoids a mate in one for the other side', () => {
    // Black threatens Qxf2#; white must defend f2 or get out of the way.
    const game = new ChessGame('r1b1kbnr/pppp1ppp/2n5/4p3/2B1P2q/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1');
    const move = game.getBestMove({ random: () => 0 })!;

    game.move(move.uci);
    expect(game.getLegalMoves().some((m) => m.san.endsWith('#'))).to.equal(false);
  });

  it('getBestMove returns a legal move, and null once the game is over', () => {
    const game = new ChessGame();
    const move = game.getBestMove({ depth: 2 })!;

    expect(game.getLegalMoves().map((m) => m.uci)).to.include(move.uci);
    expect(game.fen()).to.equal(START_FEN); // searching leaves the position alone

    play(game, 'f3', 'e5', 'g4', 'Qh4');
    expect(game.getBestMove()).to.equal(null);
  });

  it('random games keep the board in sync and always end legally', () => {
    let seed = 21;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    for (let i = 0; i < 20; i += 1) {
      const game = new ChessGame();

      while (game.getStatus().state === 'playing' && game.moves.length < 300) {
        const moves = game.getLegalMoves();
        game.move(moves[Math.floor(random() * moves.length)].uci);
      }

      // The board mirrors the FEN.
      const placement = game.fen().split(' ')[0].replace(/\d/g, (n) => '.'.repeat(Number(n)));
      const fromBoard = game.board
        .getBoardMatrix()
        .map((row) =>
          row
            .map(({ item }) =>
              item ? (item.color === 'white' ? item.type.toUpperCase() : item.type) : '.'
            )
            .join('')
        )
        .join('/');
      expect(fromBoard).to.equal(placement);

      const restored = ChessGame.fromJSON(game.toJSON());
      expect(restored.getStatus()).to.deep.equal(game.getStatus());
    }
  }, 30_000);
});
