import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WINDOW_CONTEXT } from '../../../injection-tokens';
import { FileSystemService } from '../../../services/file-system.service';
import { OsInteractionService } from '../../../services/os-interaction.service';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-viewer.component.html',
  // Fix: Corrected typo from `Change.OnPush` to `ChangeDetectionStrategy.OnPush`
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoViewerComponent implements OnInit {
  private context = inject(WINDOW_CONTEXT, { optional: true });
  private fs = inject(FileSystemService);
  private osInteraction = inject(OsInteractionService);

  imageSrc = signal<string | null>(null);
  error = signal<string | null>(null);
  fileName = signal<string>('Photo Viewer');
  
  // Editing state
  rotation = signal(0);
  scale = signal({ x: 1, y: 1 });
  filter = signal('none');

  imageStyle = computed(() => {
    const transform = `rotate(${this.rotation()}deg) scaleX(${this.scale().x}) scaleY(${this.scale().y})`;
    const filterValue = this.filter() !== 'none' ? `${this.filter()}(1)` : 'none';
    return {
      transform: transform,
      filter: filterValue
    };
  });

  ngOnInit() {
    const path = this.context?.filePath;
    if (path) {
      this.openFileFromPath(path);
    } else {
       this.imageSrc.set(null);
       this.fileName.set('Photo Viewer');
    }
  }

  private openFileFromPath(path: string) {
    const fileContent = this.fs.readFile(path);
    if (fileContent !== null) {
      this.imageSrc.set(fileContent);
      const name = path.split('/').pop() || 'Photo';
      this.fileName.set(name);
      this.updateWindowTitle(name);
      this.resetEdits();
    } else {
      this.error.set('Could not load image file.');
    }
  }

  private updateWindowTitle(title: string) {
    const windowId = this.context?.windowId;
    if (windowId) {
        this.osInteraction.updateWindowTitle.next({ 
            windowId: windowId, 
            newTitle: title
        });
    }
  }

  openLocalFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.error.set('Selected file is not an image.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageSrc.set(e.target?.result as string);
        this.fileName.set(file.name);
        this.updateWindowTitle(file.name);
        this.error.set(null);
        this.resetEdits();
      };
      reader.onerror = () => {
        this.error.set('Failed to read the selected file.');
      };
      reader.readAsDataURL(file);
    }
  }

  // Editing functions
  rotate(degrees: number) {
    this.rotation.update(r => r + degrees);
  }

  flip(axis: 'x' | 'y') {
    this.scale.update(s => ({
      ...s,
      [axis]: s[axis] * -1
    }));
  }

  applyFilter(filterName: 'grayscale' | 'sepia' | 'invert' | 'none') {
    this.filter.set(filterName);
  }

  resetEdits() {
    this.rotation.set(0);
    this.scale.set({ x: 1, y: 1 });
    this.filter.set('none');
  }
}
