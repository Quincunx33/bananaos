
import { ChangeDetectionStrategy, Component, effect, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { OsInteractionService } from '../../../services/os-interaction.service';

interface Task {
  id: number;
  content: string;
}

interface Column {
  id: number;
  title: string;
  tasks: Task[];
}

const KANBAN_STORAGE_KEY = 'banana-os-kanban-board';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanComponent {
  board = signal<Column[]>([]);
  
  private draggedTask: { colId: number; taskId: number } | null = null;
  private osInteraction = inject(OsInteractionService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.loadBoard();
    if (this.board().length === 0) {
      this.initializeDefaultBoard();
    }
    effect(() => {
      this.saveBoard();
    });

    this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'kanban' && action.action === 'addKanbanTask') {
          const { columnTitle, taskContent } = action.payload;
          this.addTaskToColumn(columnTitle, taskContent);
        }
      });
  }

  private loadBoard() {
    const savedBoard = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (savedBoard) {
      this.board.set(JSON.parse(savedBoard));
    }
  }

  private saveBoard() {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(this.board()));
  }
  
  private initializeDefaultBoard() {
      this.board.set([
          { id: 1, title: 'To Do', tasks: [{id: 101, content: 'Design the new logo'}] },
          { id: 2, title: 'In Progress', tasks: [{id: 201, content: 'Develop the main feature'}] },
          { id: 3, title: 'Done', tasks: [{id: 301, content: 'Initial project setup'}] },
      ]);
  }

  addColumn() {
    const newTitle = prompt('Enter new column title:');
    if (newTitle) {
      this.board.update(b => [
        ...b,
        { id: Date.now(), title: newTitle, tasks: [] }
      ]);
    }
  }

  addTask(colId: number) {
    const newContent = prompt('Enter new task content:');
    if (newContent) {
      this.addTaskToColumnById(colId, newContent);
    }
  }

  private addTaskToColumn(columnTitle: string, taskContent: string) {
    this.board.update(currentBoard => 
      currentBoard.map(column => {
        if (column.title.toLowerCase() === columnTitle.toLowerCase()) {
          const newTask = { id: Date.now(), content: taskContent };
          return { ...column, tasks: [...column.tasks, newTask] };
        }
        return column;
      })
    );
  }
  
  private addTaskToColumnById(colId: number, taskContent: string) {
    this.board.update(currentBoard => 
      currentBoard.map(column => {
        if (column.id === colId) {
          const newTask = { id: Date.now(), content: taskContent };
          return { ...column, tasks: [...column.tasks, newTask] };
        }
        return column;
      })
    );
  }

  // Drag and Drop Handlers
  onDragStart(colId: number, taskId: number) {
    this.draggedTask = { colId, taskId };
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow drop
  }

  onDrop(event: DragEvent, targetColId: number) {
    event.preventDefault();
    if (!this.draggedTask) return;

    const { colId: sourceColId, taskId } = this.draggedTask;
    
    // Do not update if dropping in the same column
    if (sourceColId === targetColId) {
      this.draggedTask = null;
      this.clearDragOverStyles();
      return;
    }

    this.board.update(board => {
      let taskToMove: Task | undefined;
      // First, remove the task from the source column
      const boardWithoutTask = board.map(col => {
        if (col.id === sourceColId) {
          const taskIndex = col.tasks.findIndex(t => t.id === taskId);
          if (taskIndex > -1) {
            taskToMove = col.tasks[taskIndex];
            return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
          }
        }
        return col;
      });

      // If the task was found and removed, add it to the target column
      if (taskToMove) {
        return boardWithoutTask.map(col => {
          if (col.id === targetColId) {
            return { ...col, tasks: [...col.tasks, taskToMove!] };
          }
          return col;
        });
      }

      // If task wasn't found for some reason, return original board
      return board;
    });
    
    this.draggedTask = null;
    this.clearDragOverStyles();
  }
  
  onDragEnter(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  private clearDragOverStyles() {
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  }
}