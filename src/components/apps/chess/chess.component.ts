import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Player = 'white' | 'black';
type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
interface Piece {
  player: Player;
  type: PieceType;
}
type Square = Piece | null;
type Board = Square[][];
interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
}


@Component({
  selector: 'app-chess',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess.component.html',
  styleUrls: ['./chess.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChessComponent {
  board = signal<Board>(this.createInitialBoard());
  currentPlayer = signal<Player>('white');
  selectedSquare = signal<{ row: number; col: number } | null>(null);
  statusMessage = signal("Your turn (White)");
  gameOver = signal<string | null>(null);
  
  validMoves = signal<Set<string>>(new Set());
  capturedByWhite = signal<Piece[]>([]);
  capturedByBlack = signal<Piece[]>([]);

  pieceIcons = computed(() => {
    const icons: { [key in Player]: { [key in PieceType]: string } } = {
      white: {
        pawn: 'fas fa-chess-pawn', rook: 'fas fa-chess-rook', knight: 'fas fa-chess-knight',
        bishop: 'fas fa-chess-bishop', queen: 'fas fa-chess-queen', king: 'fas fa-chess-king',
      },
      black: {
        pawn: 'fas fa-chess-pawn', rook: 'fas fa-chess-rook', knight: 'fas fa-chess-knight',
        bishop: 'fas fa-chess-bishop', queen: 'fas fa-chess-queen', king: 'fas fa-chess-king',
      },
    };
    return icons;
  });

  handleSquareClick(row: number, col: number) {
    if (this.gameOver() || this.currentPlayer() === 'black') return;

    const selected = this.selectedSquare();
    const piece = this.board()[row][col];

    if (selected) {
      if (this.validMoves().has(`${row},${col}`)) {
        this.movePiece(selected, { row, col });
      }
      this.selectedSquare.set(null);
      this.validMoves.set(new Set());
    } else if (piece && piece.player === this.currentPlayer()) {
      this.selectedSquare.set({ row, col });
      this.calculateValidMoves(row, col, piece);
    }
  }

  private movePiece(from: { row: number; col: number }, to: { row: number; col: number }) {
    this.board.update(board => {
      const newBoard = JSON.parse(JSON.stringify(board));
      const pieceToMove = newBoard[from.row][from.col];
      const targetPiece = newBoard[to.row][to.col];

      if (targetPiece) {
        if (targetPiece.player === 'white') this.capturedByBlack.update(c => [...c, targetPiece]);
        else this.capturedByWhite.update(c => [...c, targetPiece]);
        
        if (targetPiece.type === 'king') {
          this.gameOver.set(`${this.currentPlayer()} wins!`);
          this.statusMessage.set(`Game Over! ${this.currentPlayer()} wins!`);
        }
      }

      newBoard[to.row][to.col] = pieceToMove;
      newBoard[from.row][from.col] = null;
      
      if (!this.gameOver()) {
        this.currentPlayer.set('black');
        this.statusMessage.set("AI is thinking...");
        setTimeout(() => this.makeAiMove(), 500);
      }
      
      return newBoard;
    });
  }
  
  private makeAiMove() {
      if(this.gameOver()) return;
      const allMoves = this.getAllPossibleMoves('black');
      if (allMoves.length === 0) {
          this.gameOver.set("Stalemate or White wins!");
          this.statusMessage.set("Stalemate or White wins!");
          return;
      }

      const capturingMoves = allMoves.filter(move => this.board()[move.to.row][move.to.col] !== null);
      
      const moveToMake = capturingMoves.length > 0
          ? capturingMoves[Math.floor(Math.random() * capturingMoves.length)]
          : allMoves[Math.floor(Math.random() * allMoves.length)];
          
      this.movePiece(moveToMake.from, moveToMake.to);
      
      if (!this.gameOver()) {
        this.currentPlayer.set('white');
        this.statusMessage.set("Your turn (White)");
      }
  }

  resetGame() {
    this.board.set(this.createInitialBoard());
    this.currentPlayer.set('white');
    this.selectedSquare.set(null);
    this.statusMessage.set("Your turn (White)");
    this.gameOver.set(null);
    this.validMoves.set(new Set());
    this.capturedByWhite.set([]);
    this.capturedByBlack.set([]);
  }

  private calculateValidMoves(row: number, col: number, piece: Piece) {
    const moves = new Set<string>();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.isMoveValid(piece, { row, col }, { row: r, col: c })) {
          moves.add(`${r},${c}`);
        }
      }
    }
    this.validMoves.set(moves);
  }

  private isMoveValid(piece: Piece, from: {row: number, col: number}, to: {row: number, col: number}): boolean {
      const board = this.board();
      const targetPiece = board[to.row][to.col];
      if(targetPiece && targetPiece.player === piece.player) return false;

      const dr = to.row - from.row;
      const dc = to.col - from.col;

      switch(piece.type) {
          case 'pawn':
              const direction = piece.player === 'white' ? -1 : 1;
              // Move forward
              if (dc === 0 && !targetPiece) {
                  if (dr === direction) return true;
                  const startRow = piece.player === 'white' ? 6 : 1;
                  if (from.row === startRow && dr === 2 * direction && !board[from.row+direction][from.col]) return true;
              }
              // Capture
              if (Math.abs(dc) === 1 && dr === direction && targetPiece) return true;
              return false;

          case 'rook':
              if (dr !== 0 && dc !== 0) return false;
              return this.isPathClear(from, to);

          case 'knight':
              return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);

          case 'bishop':
              if (Math.abs(dr) !== Math.abs(dc)) return false;
              return this.isPathClear(from, to);
              
          case 'queen':
              const isStraight = dr === 0 || dc === 0;
              const isDiagonal = Math.abs(dr) === Math.abs(dc);
              if (!isStraight && !isDiagonal) return false;
              return this.isPathClear(from, to);
              
          case 'king':
              return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      }
      return false;
  }
  
  private isPathClear(from: {row: number, col: number}, to: {row: number, col: number}): boolean {
      const board = this.board();
      const dr = Math.sign(to.row - from.row);
      const dc = Math.sign(to.col - from.col);
      let r = from.row + dr;
      let c = from.col + dc;
      while (r !== to.row || c !== to.col) {
          if (board[r][c]) return false;
          r += dr;
          c += dc;
      }
      return true;
  }

  private getAllPossibleMoves(player: Player): Move[] {
      const moves: Move[] = [];
      const board = this.board();
      for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
              const piece = board[r][c];
              if (piece && piece.player === player) {
                  for (let tr = 0; tr < 8; tr++) {
                      for (let tc = 0; tc < 8; tc++) {
                          if (this.isMoveValid(piece, {row: r, col: c}, {row: tr, col: tc})) {
                              moves.push({ from: {row: r, col: c}, to: {row: tr, col: tc} });
                          }
                      }
                  }
              }
          }
      }
      return moves;
  }

  private createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    const place = (row: number, col: number, player: Player, type: PieceType) => {
      board[row][col] = { player, type };
    };

    for (let i = 0; i < 8; i++) {
      place(1, i, 'black', 'pawn');
      place(6, i, 'white', 'pawn');
    }
    place(0, 0, 'black', 'rook'); place(0, 7, 'black', 'rook');
    place(7, 0, 'white', 'rook'); place(7, 7, 'white', 'rook');
    place(0, 1, 'black', 'knight'); place(0, 6, 'black', 'knight');
    place(7, 1, 'white', 'knight'); place(7, 6, 'white', 'knight');
    place(0, 2, 'black', 'bishop'); place(0, 5, 'black', 'bishop');
    place(7, 2, 'white', 'bishop'); place(7, 5, 'white', 'bishop');
    place(0, 3, 'black', 'queen');
    place(7, 3, 'white', 'queen');
    place(0, 4, 'black', 'king');
    place(7, 4, 'white', 'king');

    return board;
  }
}
