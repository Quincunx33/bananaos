import { ChangeDetectionStrategy, Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cell {
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}
type GameState = 'playing' | 'won' | 'lost';

@Component({
  selector: 'app-minesweeper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minesweeper.component.html',
  styleUrls: ['./minesweeper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinesweeperComponent implements OnDestroy {
  rows = 16;
  cols = 16;
  mines = 40;

  board = signal<Cell[][]>([]);
  gameState = signal<GameState>('playing');
  flagsPlaced = signal(0);
  timer = signal(0);
  private timerInterval: any;
  
  constructor() {
    this.newGame();
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  newGame() {
    this.gameState.set('playing');
    this.flagsPlaced.set(0);
    this.timer.set(0);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.initializeBoard();
  }

  initializeBoard() {
    const newBoard: Cell[][] = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(null).map(() => ({
        hasMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0
      }))
    );
    this.board.set(newBoard);
  }
  
  startTimer() {
      if(this.timerInterval) return;
      this.timerInterval = setInterval(() => this.timer.update(t => t + 1), 1000);
  }

  placeMines(firstClickRow: number, firstClickCol: number) {
    let minesToPlace = this.mines;
    const currentBoard = this.board();
    while (minesToPlace > 0) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      if (!currentBoard[row][col].hasMine && !(row === firstClickRow && col === firstClickCol)) {
        currentBoard[row][col].hasMine = true;
        minesToPlace--;
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!currentBoard[r][c].hasMine) {
          currentBoard[r][c].adjacentMines = this.countAdjacentMines(r, c);
        }
      }
    }
  }

  countAdjacentMines(row: number, col: number): number {
    let count = 0;
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols && this.board()[newRow][newCol].hasMine) {
          count++;
        }
      }
    }
    return count;
  }

  handleCellClick(row: number, col: number, event: MouseEvent) {
    if (this.gameState() !== 'playing') return;
    
    const isFirstClick = !this.board().flat().some(cell => cell.hasMine);
    if (isFirstClick) {
      this.placeMines(row, col);
      this.startTimer();
    }
    
    const cell = this.board()[row][col];
    if (event.button === 0 && !cell.isFlagged && !cell.isRevealed) {
      this.revealCell(row, col);
    } else if (event.button === 2 && !cell.isRevealed) {
      event.preventDefault();
      this.toggleFlag(row, col);
    }
    this.checkWinCondition();
  }

  revealCell(row: number, col: number) {
    const cell = this.board()[row][col];
    if (cell.isRevealed || cell.isFlagged) return;
    cell.isRevealed = true;

    if (cell.hasMine) {
      this.gameState.set('lost');
      clearInterval(this.timerInterval);
      this.revealAllMines();
      return;
    }

    if (cell.adjacentMines === 0) {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          const newRow = row + r;
          const newCol = col + c;
          if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
            this.revealCell(newRow, newCol);
          }
        }
      }
    }
  }

  toggleFlag(row: number, col: number) {
    const cell = this.board()[row][col];
    if(cell.isFlagged) {
        cell.isFlagged = false;
        this.flagsPlaced.update(f => f - 1);
    } else {
        cell.isFlagged = true;
        this.flagsPlaced.update(f => f + 1);
    }
  }
  
  revealAllMines() {
      this.board().forEach(row => row.forEach(cell => {
          if(cell.hasMine) cell.isRevealed = true;
      }));
  }

  checkWinCondition() {
    if(this.gameState() !== 'playing') return;
    const nonMineCells = this.board().flat().filter(cell => !cell.hasMine);
    const allRevealed = nonMineCells.every(cell => cell.isRevealed);
    if (allRevealed) {
      this.gameState.set('won');
      clearInterval(this.timerInterval);
    }
  }

  formatTime(seconds: number): string {
      return seconds.toString().padStart(3, '0');
  }
}
