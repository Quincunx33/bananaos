import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25; // in pixels

const SHAPES = [
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[0,1,1],[1,1,0]], // S
  [[1,1,0],[0,1,1]], // Z
  [[1,0,0],[1,1,1]], // L
  [[0,0,1],[1,1,1]]  // J
];
const COLORS = ['cyan', 'yellow', 'purple', 'green', 'red', 'orange', 'blue'];

interface Piece {
  x: number;
  y: number;
  shape: number[][];
  color: string;
}

@Component({
  selector: 'app-puzzle-blocks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './puzzle-blocks.component.html',
  styleUrls: ['./puzzle-blocks.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PuzzleBlocksComponent implements OnInit, OnDestroy {
  board = signal<string[][]>(this.createEmptyBoard());
  score = signal(0);
  gameOver = signal(false);
  
  private currentPiece!: Piece;
  nextPiece = signal<Piece | null>(null);
  private gameInterval: any;

  ngOnInit() {
    this.startGame();
  }

  ngOnDestroy() {
    if (this.gameInterval) clearInterval(this.gameInterval);
  }

  startGame() {
    this.board.set(this.createEmptyBoard());
    this.score.set(0);
    this.gameOver.set(false);
    this.nextPiece.set(this.createNewPiece());
    this.spawnNewPiece();
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.gameInterval = setInterval(() => this.gameLoop(), 1000);
  }

  private gameLoop() {
    if (this.gameOver()) {
      clearInterval(this.gameInterval);
      return;
    }
    this.movePiece(0, 1);
  }

  private createEmptyBoard(): string[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill('black'));
  }

  private createNewPiece(): Piece {
    const typeId = Math.floor(Math.random() * SHAPES.length);
    return {
      x: Math.floor(COLS / 2) - 1,
      y: 0,
      shape: SHAPES[typeId],
      color: COLORS[typeId],
    };
  }

  private spawnNewPiece() {
    this.currentPiece = this.nextPiece()!;
    this.nextPiece.set(this.createNewPiece());

    if (!this.isValidMove(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver.set(true);
    }
  }
  
  private movePiece(dx: number, dy: number) {
    if (this.isValidMove(this.currentPiece.shape, this.currentPiece.x + dx, this.currentPiece.y + dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
    } else if (dy > 0) {
      this.lockPiece();
      this.clearLines();
      this.spawnNewPiece();
    }
  }

  private rotatePiece() {
    const shape = this.currentPiece.shape;
    const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
    if (this.isValidMove(newShape, this.currentPiece.x, this.currentPiece.y)) {
      this.currentPiece.shape = newShape;
    }
  }

  private lockPiece() {
    this.board.update(board => {
        const newBoard = JSON.parse(JSON.stringify(board));
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
            if (value > 0) {
                newBoard[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.color;
            }
            });
        });
        return newBoard;
    });
  }
  
  private clearLines() {
      this.board.update(board => {
          let linesCleared = 0;
          const newBoard = board.filter(row => {
              if (row.every(cell => cell !== 'black')) {
                  linesCleared++;
                  return false;
              }
              return true;
          });
          
          for (let i = 0; i < linesCleared; i++) {
              newBoard.unshift(Array(COLS).fill('black'));
          }

          if (linesCleared > 0) {
              this.score.update(s => s + linesCleared * 100 * linesCleared);
          }
          return newBoard;
      });
  }
  
  private isValidMove(shape: number[][], newX: number, newY: number): boolean {
    const currentBoard = this.board();
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] > 0) {
          const boardX = newX + x;
          const boardY = newY + y;
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS || (boardY >= 0 && currentBoard[boardY][boardX] !== 'black')) {
            return false;
          }
        }
      }
    }
    return true;
  }
  
  get renderedBoard() {
      if(this.gameOver()) return this.board();
      const boardCopy = JSON.parse(JSON.stringify(this.board()));
      this.currentPiece?.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value > 0) {
            boardCopy[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.color;
          }
        });
      });
      return boardCopy;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(this.gameOver()) return;
    switch (event.key) {
      case 'ArrowLeft': this.movePiece(-1, 0); break;
      case 'ArrowRight': this.movePiece(1, 0); break;
      case 'ArrowDown': this.movePiece(0, 1); break;
      case 'ArrowUp': this.rotatePiece(); break;
    }
  }
}
