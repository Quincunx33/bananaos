import { ChangeDetectionStrategy, Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
  previousRow?: number;
  previousCol?: number;
}

let tileIdCounter = 0;

@Component({
  selector: 'app-2048',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './2048.component.html',
  styleUrls: ['./2048.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Game2048Component implements OnInit {
  tiles = signal<Tile[]>([]);
  score = signal(0);
  gameOver = signal(false);
  
  private size = 4;
  private isMoving = false;

  ngOnInit() {
    this.newGame();
  }

  newGame() {
    let initialTiles: Tile[] = [];
    initialTiles = this.addRandomTile(initialTiles);
    initialTiles = this.addRandomTile(initialTiles);
    this.tiles.set(initialTiles);
    this.score.set(0);
    this.gameOver.set(false);
  }

  private addRandomTile(tiles: Tile[]): Tile[] {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!tiles.some(t => t.row === r && t.col === c)) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      tiles.push({
        id: tileIdCounter++,
        value: Math.random() < 0.9 ? 2 : 4,
        row: r,
        col: c,
        isNew: true,
        isMerged: false
      });
    }
    return tiles;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.gameOver() || this.isMoving) return;

    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    switch (event.key) {
      case 'ArrowUp': direction = 'up'; break;
      case 'ArrowDown': direction = 'down'; break;
      case 'ArrowLeft': direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
    }
    if (direction) {
      this.move(direction);
    }
  }

  private move(direction: 'up' | 'down' | 'left' | 'right') {
    this.isMoving = true;
    let currentTiles = this.tiles().map(t => ({...t, isNew: false, isMerged: false}));
    
    // Prepare for move: create a grid representation
    const grid: (Tile | null)[][] = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    currentTiles.forEach(t => grid[t.row][t.col] = t);
    
    const moveVector = { up: {r: -1, c: 0}, down: {r: 1, c: 0}, left: {r: 0, c: -1}, right: {r: 0, c: 1} }[direction];
    const traversals = this.buildTraversals(moveVector);
    let moved = false;

    traversals.r.forEach(r => {
      traversals.c.forEach(c => {
        const cell = {r, c};
        const tile = grid[r][c];
        if (tile) {
          const { farthest, next } = this.findFarthestPosition(grid, cell, moveVector);
          const nextTile = next ? grid[next.r][next.c] : null;

          if (nextTile && nextTile.value === tile.value && !nextTile.isMerged) {
            // Merge
            const merged: Tile = {
              id: tileIdCounter++,
              value: tile.value * 2,
              row: next.r,
              col: next.c,
              isMerged: true,
              isNew: false,
            };
            this.score.update(s => s + merged.value);
            
            grid[tile.row][tile.col] = null;
            grid[next.r][next.c] = merged;
            
            const tileToRemove = currentTiles.find(t => t.id === tile.id)!;
            tileToRemove.row = next.r;
            tileToRemove.col = next.c;
            
            const nextTileInArray = currentTiles.find(t => t.id === nextTile.id)!;
            nextTileInArray.row = -1; // Mark for removal
            
            moved = true;
          } else {
            // Move
            if (farthest.r !== tile.row || farthest.c !== tile.col) {
              grid[tile.row][tile.col] = null;
              grid[farthest.r][farthest.c] = tile;
              tile.row = farthest.r;
              tile.col = farthest.c;
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      // Clean up tiles marked for removal and update state
      let newTiles = currentTiles.filter(t => t.row !== -1);
      newTiles = this.addRandomTile(newTiles);
      this.tiles.set(newTiles);
      
      if (!this.movesAvailable()) {
          this.gameOver.set(true);
      }
    }
    
    setTimeout(() => { this.isMoving = false; }, 200);
  }

  private findFarthestPosition(grid: (Tile | null)[][], cell: {r: number, c: number}, vector: {r: number, c: number}) {
    let previous;
    do {
      previous = cell;
      cell = { r: previous.r + vector.r, c: previous.c + vector.c };
    } while (this.isWithinBounds(cell) && !grid[cell.r][cell.c]);
    
    return { farthest: previous, next: cell };
  }
  
  private isWithinBounds(cell: {r: number, c: number}) {
      return cell.r >= 0 && cell.r < this.size && cell.c >= 0 && cell.c < this.size;
  }

  private buildTraversals(vector: {r: number, c: number}) {
    const traversals: { r: number[], c: number[] } = { r: [], c: [] };
    for (let i = 0; i < this.size; i++) {
      traversals.r.push(i);
      traversals.c.push(i);
    }
    if (vector.r === 1) traversals.r = traversals.r.reverse();
    if (vector.c === 1) traversals.c = traversals.c.reverse();
    return traversals;
  }

  private movesAvailable(): boolean {
    const tiles = this.tiles();
    if (tiles.length < this.size * this.size) return true;

    for(const tile of tiles) {
      for(const dir of [{r:0,c:1}, {r:0,c:-1}, {r:1,c:0}, {r:-1,c:0}]) {
        const neighborPos = {r: tile.row + dir.r, c: tile.col + dir.c};
        if(this.isWithinBounds(neighborPos)) {
            const neighbor = tiles.find(t => t.row === neighborPos.r && t.col === neighborPos.c);
            if (neighbor && neighbor.value === tile.value) return true;
        }
      }
    }
    return false;
  }
}