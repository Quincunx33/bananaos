import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ALICE_IN_WONDERLAND } from './book-data';

interface Book {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  chapters: { title: string; content: string[] }[];
}

@Component({
  selector: 'app-ebook-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ebook-reader.component.html',
  styleUrls: ['./ebook-reader.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EbookReaderComponent {
  books = signal<Book[]>([ALICE_IN_WONDERLAND]);
  
  readingMode = signal(false);
  currentBook = signal<Book | null>(null);
  currentChapterIndex = signal(0);
  fontSize = signal(16); // in pixels

  currentChapter = computed(() => {
    const book = this.currentBook();
    if (!book) return null;
    return book.chapters[this.currentChapterIndex()];
  });
  
  openBook(book: Book) {
    this.currentBook.set(book);
    this.currentChapterIndex.set(0);
    this.readingMode.set(true);
  }

  closeReader() {
    this.readingMode.set(false);
    this.currentBook.set(null);
  }

  nextChapter() {
    const book = this.currentBook();
    if (book && this.currentChapterIndex() < book.chapters.length - 1) {
      this.currentChapterIndex.update(i => i + 1);
    }
  }

  prevChapter() {
    if (this.currentChapterIndex() > 0) {
      this.currentChapterIndex.update(i => i - 1);
    }
  }

  changeFontSize(delta: number) {
    this.fontSize.update(size => Math.max(12, Math.min(24, size + delta)));
  }
}
