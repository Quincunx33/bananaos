import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cell {
  value: number | null;
  isGiven: boolean;
  isInvalid: boolean;
}

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SudokuComponent {
  board = signal<Cell[][]>([]);
  selectedCell = signal<{ row: number; col: number } | null>(null);
  
  isComplete = computed(() => {
    const currentBoard = this.board();
    if (currentBoard.length === 0) return false;
    if (currentBoard.flat().some(cell => cell.value === null || cell.isInvalid)) {
      return false;
    }
    return true;
  });

  // Computed signals for highlighting
  highlightedRow = computed(() => this.selectedCell()?.row ?? -1);
  highlightedCol = computed(() => this.selectedCell()?.col ?? -1);
  highlightedBox = computed(() => {
    const selected = this.selectedCell();
    if (!selected) return { row: -1, col: -1 };
    return { row: Math.floor(selected.row / 3), col: Math.floor(selected.col / 3) };
  });
  highlightedNum = computed(() => {
      const selected = this.selectedCell();
      if (!selected) return null;
      const board = this.board();
      if (board.length > 0) {
        return board[selected.row][selected.col].value;
      }
      return null;
  });

  constructor() {
    this.newGame();
  }

  newGame() {
    const puzzle = [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9],
    ];

    this.board.set(
      puzzle.map(row =>
        row.map(value => ({
          value,
          isGiven: value !== null,
          isInvalid: false,
        }))
      )
    );
    this.selectedCell.set(null);
  }

  selectCell(row: number, col: number) {
    if (this.board()[row][col].isGiven) {
      this.selectedCell.set(null);
    } else {
      this.selectedCell.set({ row, col });
    }
  }

  setNumber(num: number) {
    const selected = this.selectedCell();
    if (selected) {
      this.board.update(board => {
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[selected.row][selected.col].value = num;
        this.validateBoard(newBoard);
        return newBoard;
      });
    }
  }

  eraseNumber() {
    const selected = this.selectedCell();
    if (selected) {
      this.board.update(board => {
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[selected.row][selected.col].value = null;
        this.validateBoard(newBoard);
        return newBoard;
      });
    }
  }

  private validateBoard(board: Cell[][]) {
    // Reset invalid status
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        board[r][c].isInvalid = false;
      }
    }

    // Check for invalid cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const value = board[r][c].value;
        if (value !== null) {
            if (!this.isValidPlacement(board, r, c, value)) {
                board[r][c].isInvalid = true;
            }
        }
      }
    }
  }

  private isValidPlacement(board: Cell[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c].value === num) return false;
    }
    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col].value === num) return false;
    }
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const checkRow = startRow + r;
        const checkCol = startCol + c;
        if ((checkRow !== row || checkCol !== col) && board[checkRow][checkCol].value === num) {
          return false;
        }
      }
    }
    return true;
  }
  
  isCellInHighlightedBox(r: number, c: number): boolean {
    const highlightedBox = this.highlightedBox();
    return Math.floor(r / 3) === highlightedBox.row && Math.floor(c / 3) === highlightedBox.col;
  }
}
