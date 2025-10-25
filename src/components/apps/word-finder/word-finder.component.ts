import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GridCell {
  letter: string;
  isSelected: boolean;
}

@Component({
  selector: 'app-word-finder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-finder.component.html',
  styleUrls: ['./word-finder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordFinderComponent {
  gridSize = 10;
  wordsToFind = ['ANGULAR', 'SIGNAL', 'COMPONENT', 'BANANA', 'DESKTOP'];
  
  grid = signal<GridCell[][]>([]);
  foundWords = signal<string[]>([]);
  
  private isSelecting = false;
  private selection = signal<{r: number, c: number}[]>([]);
  
  isGameWon = computed(() => this.foundWords().length === this.wordsToFind.length);

  constructor() {
    this.newGame();
  }

  newGame() {
    this.foundWords.set([]);
    this.selection.set([]);
    this.generateGrid();
  }
  
  private generateGrid() {
    const newGrid: GridCell[][] = Array.from({ length: this.gridSize }, () =>
      Array.from({ length: this.gridSize }, () => ({ letter: this.getRandomLetter(), isSelected: false }))
    );
    
    // Place words
    this.wordsToFind.forEach(word => this.placeWord(word, newGrid));
    
    this.grid.set(newGrid);
  }
  
  private placeWord(word: string, grid: GridCell[][]) {
    const directions = [[0, 1], [1, 0], [1, 1]]; // Horizontal, Vertical, Diagonal
    let placed = false;
    while (!placed) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const startR = Math.floor(Math.random() * this.gridSize);
      const startC = Math.floor(Math.random() * this.gridSize);
      
      const endR = startR + (word.length - 1) * dir[0];
      const endC = startC + (word.length - 1) * dir[1];

      if (endR < this.gridSize && endC < this.gridSize) {
        // Place the word
        for (let i = 0; i < word.length; i++) {
          grid[startR + i * dir[0]][startC + i * dir[1]].letter = word[i];
        }
        placed = true;
      }
    }
  }

  private getRandomLetter(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  startSelection(r: number, c: number) {
    this.isSelecting = true;
    this.selection.set([{r, c}]);
    this.updateGridSelection();
  }

  updateSelection(r: number, c: number) {
    if (!this.isSelecting) return;
    const currentSelection = this.selection();
    if (!currentSelection.some(cell => cell.r === r && cell.c === c)) {
      this.selection.update(s => [...s, {r, c}]);
      this.updateGridSelection();
    }
  }

  endSelection() {
    this.isSelecting = false;
    const selectedWord = this.selection().map(cell => this.grid()[cell.r][cell.c].letter).join('');
    
    if (this.wordsToFind.includes(selectedWord) && !this.foundWords().includes(selectedWord)) {
      this.foundWords.update(fw => [...fw, selectedWord]);
    } else {
        const reversedWord = selectedWord.split('').reverse().join('');
        if (this.wordsToFind.includes(reversedWord) && !this.foundWords().includes(reversedWord)) {
            this.foundWords.update(fw => [...fw, reversedWord]);
        }
    }

    this.selection.set([]);
    this.updateGridSelection();
  }

  private updateGridSelection() {
    const selectedCoords = new Set(this.selection().map(s => `${s.r}-${s.c}`));
    this.grid.update(grid => grid.map((row, r) => row.map((cell, c) => ({
      ...cell,
      isSelected: selectedCoords.has(`${r}-${c}`)
    }))));
  }

  isWordFound(word: string): boolean {
    return this.foundWords().includes(word);
  }
}
