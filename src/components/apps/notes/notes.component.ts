import { ChangeDetectionStrategy, Component, effect, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OsInteractionService } from '../../../services/os-interaction.service';

interface Note {
  id: number;
  title: string;
  content: string;
  lastModified: number;
}

const NOTES_STORAGE_KEY = 'banana-os-notes';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesComponent {
  notes = signal<Note[]>([]);
  selectedNoteId = signal<number | null>(null);
  selectedNoteContent = signal('');

  private osInteraction = inject(OsInteractionService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.loadNotes();
    
    // Auto-save effect
    effect(() => {
        const content = this.selectedNoteContent();
        const id = this.selectedNoteId();
        if (id !== null) {
            this.updateNoteContent(id, content);
        }
    }, { allowSignalWrites: true });

    this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'prod-notes' && action.action === 'createNote') {
          this.createNewNote(action.payload.title, action.payload.content);
        }
      });
  }

  private loadNotes() {
    const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    if (savedNotes) {
      this.notes.set(JSON.parse(savedNotes));
    }
    // Select the first note by default if available
    if (this.notes().length > 0) {
      this.selectNote(this.notes()[0]);
    }
  }

  private saveNotes() {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(this.notes()));
  }
  
  selectNote(note: Note) {
    this.selectedNoteId.set(note.id);
    this.selectedNoteContent.set(note.content);
  }

  createNewNote(title: string = 'New Note', content: string = '') {
    const newNote: Note = {
      id: Date.now(),
      title,
      content,
      lastModified: Date.now(),
    };
    this.notes.update(notes => [newNote, ...notes].sort((a, b) => b.lastModified - a.lastModified));
    this.selectNote(newNote);
    this.saveNotes();
  }

  deleteSelectedNote() {
    const idToDelete = this.selectedNoteId();
    if (idToDelete === null) return;

    this.notes.update(notes => notes.filter(n => n.id !== idToDelete));
    
    // Select the next available note or clear selection
    const remainingNotes = this.notes();
    if (remainingNotes.length > 0) {
      this.selectNote(remainingNotes[0]);
    } else {
      this.selectedNoteId.set(null);
      this.selectedNoteContent.set('');
    }
    this.saveNotes();
  }
  
  updateNoteContent(id: number, content: string) {
    let noteUpdated = false;
    this.notes.update(notes => {
      const noteIndex = notes.findIndex(n => n.id === id);
      if (noteIndex > -1) {
        const note = notes[noteIndex];
        if (note.content !== content) {
          note.content = content;
          note.lastModified = Date.now();
          const firstLine = content.trim().split('\n')[0];
          note.title = firstLine.substring(0, 30) || 'New Note';
          noteUpdated = true;
        }
      }
      return [...notes];
    });

    if (noteUpdated) {
        this.notes.update(notes => [...notes].sort((a, b) => b.lastModified - a.lastModified));
        this.saveNotes();
    }
  }
}
