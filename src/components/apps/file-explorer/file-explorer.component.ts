import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, ElementRef, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FileSystemNode, FileSystemService } from '../../../services/file-system.service';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-file-explorer',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './file-explorer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileExplorerComponent {
  private fsService = inject(FileSystemService);
  private osInteraction = inject(OsInteractionService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('fileUploadInput') fileUploadInput!: ElementRef<HTMLInputElement>;

  currentPath = signal('/');
  contents = signal<FileSystemNode[]>([]);
  selectedNode = signal<FileSystemNode | null>(null);

  breadcrumbs = computed(() => {
    const path = this.currentPath();
    const crumbs = path === '/' ? ['Home'] : ['Home', ...path.substring(1).split('/')];
    return crumbs.map((crumb, index) => ({
      name: crumb,
      path: index === 0 ? '/' : '/' + path.substring(1).split('/').slice(0, index).join('/')
    }));
  });

  constructor() {
    effect(() => {
      const path = this.currentPath();
      const dir = this.fsService.getDirectory(path);
      if (dir) {
        this.contents.set(Object.values(dir.children).sort((a: FileSystemNode, b: FileSystemNode) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        }));
      }
    });

    this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'file-explorer' && action.action === 'createFile') {
          const { parentPath, fileName, content } = action.payload;
          const success = this.fsService.createFile(parentPath, fileName, content || '');
          if (success) {
            this.notificationService.show({ 
              appId: 'file-explorer', 
              title: 'Copilot Action', 
              body: `File "${fileName}" created in ${parentPath}.`, 
              type: 'success' 
            });
          } else {
            this.notificationService.show({ 
              appId: 'file-explorer', 
              title: 'Copilot Action', 
              body: `Failed to create file "${fileName}". It may already exist.`, 
              type: 'error' 
            });
          }
        }
      });
  }

  selectNode(node: FileSystemNode) {
    this.selectedNode.set(node);
  }

  deselect() {
    this.selectedNode.set(null);
  }

  navigateTo(path: string) {
    if (this.fsService.getDirectory(path)) {
      this.currentPath.set(path);
      this.selectedNode.set(null); // Deselect when navigating
    }
  }

  goUp() {
    const current = this.currentPath();
    if (current === '/') return;
    const parentPath = current.substring(0, current.lastIndexOf('/')) || '/';
    this.navigateTo(parentPath);
  }

  handleDoubleClick(node: FileSystemNode) {
    this.selectedNode.set(null);
    if (node.type === 'directory') {
      this.navigateTo(node.path);
    } else {
      const extension = node.name.split('.').pop()?.toLowerCase();
      let appId: string | null = null;
      switch(extension) {
        case 'txt':
        case 'md':
        case 'js':
        case 'json':
        case 'html':
        case 'css':
          appId = 'text-editor';
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          appId = 'photo-viewer';
          break;
      }
      if (appId) {
        this.osInteraction.openAppRequest.next({ appId, data: { filePath: node.path } });
      } else {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: `File type ".${extension}" is not supported.`, type: 'warning' });
      }
    }
  }

  getIconForNode(node: FileSystemNode): string {
    if (node.type === 'directory') {
      return 'fas fa-folder text-yellow-400';
    }
    const extension = node.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt':
      case 'md':
        return 'fas fa-file-alt text-gray-300';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fas fa-file-image text-blue-400';
      case 'js':
      case 'ts':
        return 'fas fa-file-code text-green-400';
      case 'pdf':
        return 'fas fa-file-pdf text-red-500';
      case 'sys':
      case 'bin':
         return 'fas fa-cogs text-gray-500';
      default:
        return 'fas fa-file text-gray-400';
    }
  }

  createNewFolder() {
    const folderName = prompt('Enter new folder name:');
    if (folderName) {
      const success = this.fsService.createDirectory(this.currentPath(), folderName);
      if(success) this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Folder created.', type: 'success' });
      else this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Folder name already exists.', type: 'error' });
    }
  }

  createNewFile() {
    const fileName = prompt('Enter new file name:', 'new-file.txt');
    if (fileName) {
      const success = this.fsService.createFile(this.currentPath(), fileName);
      if(success) this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'File created.', type: 'success' });
      else this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'File name already exists.', type: 'error' });
    }
  }

  triggerUpload() {
    this.fileUploadInput.nativeElement.click();
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = this.fsService.createFile(this.currentPath(), file.name, content);
      if (success) {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: `File "${file.name}" uploaded.`, type: 'success' });
      } else {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: `A file named "${file.name}" already exists.`, type: 'error' });
      }
      input.value = ''; // Reset input to allow uploading same file again
    };
    
    reader.onerror = () => {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Error reading file.', type: 'error' });
        input.value = '';
    };

    reader.readAsDataURL(file);
  }

  deleteSelectedNode() {
    const node = this.selectedNode();
    if (!node) return;

    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      const success = this.fsService.deleteNode(node.path);
      if (success) {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Item deleted.', type: 'success' });
        this.selectedNode.set(null);
      } else {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Failed to delete item.', type: 'error' });
      }
    }
  }

  renameSelectedNode() {
    const node = this.selectedNode();
    if (!node) return;

    const newName = prompt('Enter new name:', node.name);
    if (newName && newName !== node.name) {
      const success = this.fsService.renameNode(node.path, newName);
      if (success) {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Item renamed.', type: 'success' });
        this.selectedNode.set(null);
      } else {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Failed to rename. Name might already exist.', type: 'error' });
      }
    }
  }
  
  isSelectedImage = computed(() => {
      const node = this.selectedNode();
      if (node?.type === 'file') {
          return node.content.startsWith('data:image');
      }
      return false;
  });
  
  isSelectedText = computed(() => {
    const node = this.selectedNode();
    if (node?.type === 'file') {
        return !node.content.startsWith('data:image') && node.content !== 'BINARY_DATA' && node.content !== 'CONFIG_DATA';
    }
    return false;
  });

  selectedDirectoryChildrenCount = computed(() => {
    const node = this.selectedNode();
    if (node?.type === 'directory') {
      return Object.keys(node.children).length;
    }
    return 0;
  });
}
