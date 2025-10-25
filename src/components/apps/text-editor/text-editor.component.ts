

import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WINDOW_CONTEXT } from '../../../injection-tokens';
import { FileSystemService } from '../../../services/file-system.service';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextEditorComponent implements OnInit {
  private context = inject(WINDOW_CONTEXT, { optional: true });
  private fs = inject(FileSystemService);
  private osInteraction = inject(OsInteractionService);
  private notificationService = inject(NotificationService);

  filePath = signal<string | null>(null);
  content = signal('');
  
  wordCount = computed(() => this.content().trim().split(/\s+/).filter(Boolean).length);
  charCount = computed(() => this.content().length);
  
  ngOnInit() {
    const path = this.context?.filePath;
    if (path) {
      this.filePath.set(path);
      const fileContent = this.fs.readFile(path);
      if (fileContent !== null) {
        this.content.set(fileContent);
      }
      
      // Update window title
      const windowId = this.context?.windowId;
      if (windowId) {
          const fileName = path.split('/').pop();
          this.osInteraction.updateWindowTitle.next({ 
              windowId: windowId, 
              newTitle: `${fileName} - Text Editor`
          });
      }
    }
  }

  saveFile() {
    const path = this.filePath();
    if (path) {
      const success = this.fs.writeFile(path, this.content());
      if (success) {
        this.notificationService.show({ appId: 'text-editor', title: 'Text Editor', body: 'File saved successfully.', type: 'success' });
      } else {
        this.notificationService.show({ appId: 'text-editor', title: 'Text Editor', body: 'Error saving file.', type: 'error' });
      }
    }
  }
}
