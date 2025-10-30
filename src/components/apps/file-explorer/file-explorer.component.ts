import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, ElementRef, ViewChild, DestroyRef, HostListener, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FileSystemNode, FileSystemService } from '../../../services/file-system.service';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { NotificationService } from '../../../services/notification.service';
import { WINDOW_CONTEXT } from '../../../injection-tokens';

type ModalType = 'newFile' | 'newFolder' | 'rename' | 'delete';
interface ModalState {
  type: ModalType;
  node?: FileSystemNode;
}

@Component({
  selector: 'app-file-explorer',
  imports: [CommonModule, DatePipe],
  standalone: true,
  templateUrl: './file-explorer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileExplorerComponent implements OnInit {
  private fsService = inject(FileSystemService);
  private osInteraction = inject(OsInteractionService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private context = inject(WINDOW_CONTEXT, { optional: true });

  @ViewChild('fileUploadInput') fileUploadInput!: ElementRef<HTMLInputElement>;
  @ViewChild('modalInputField') modalInputField!: ElementRef<HTMLInputElement>;
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.context-menu-item')) {
      this.contextMenu.update(cm => ({ ...cm, visible: false }));
    }
  }

  @HostListener('keydown.delete', ['$event'])
  onDeleteKey(event: KeyboardEvent) {
    if (this.selectedNode()) {
      event.preventDefault();
      this.requestDelete();
    }
  }

  @HostListener('keydown.escape', ['$event'])
  onEscapeKey() {
    if (this.modalState()) this.closeModal();
    if (this.contextMenu().visible) this.closeContextMenu();
    if (this.selectedNode()) this.deselect();
  }

  currentPath = signal('/');
  contents = signal<FileSystemNode[]>([]);
  selectedNode = signal<FileSystemNode | null>(null);

  // UI State
  viewMode = signal<'grid' | 'list'>('grid');
  sortBy = signal<'name' | 'size' | 'type' | 'date'>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  searchTerm = signal('');
  contextMenu = signal<{ visible: boolean; x: number; y: number; node: FileSystemNode | null }>({ visible: false, x: 0, y: 0, node: null });
  
  modalState = signal<ModalState | null>(null);
  modalInput = signal('');
  clipboard = signal<{ node: FileSystemNode; action: 'copy' | 'cut' } | null>(null);

  breadcrumbs = computed(() => {
    const path = this.currentPath();
    const crumbs = path === '/' ? ['Home'] : ['Home', ...path.substring(1).split('/')];
    return crumbs.map((crumb, index) => ({
      name: crumb,
      path: index === 0 ? '/' : '/' + path.substring(1).split('/').slice(0, index).join('/')
    }));
  });
  
  displayContents = computed(() => {
    const contents = this.contents();
    const term = this.searchTerm().toLowerCase();
    const sortBy = this.sortBy();
    const sortDir = this.sortDirection();

    const filtered = term
      ? contents.filter(node => node.name.toLowerCase().includes(term))
      : contents;

    return [...filtered].sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      let compare = 0;
      switch (sortBy) {
        case 'name':
          compare = a.name.localeCompare(b.name);
          break;
        case 'size':
          compare = a.size - b.size;
          break;
        case 'date':
          compare = b.modifiedDate - a.modifiedDate;
          break;
        case 'type':
          const extA = a.type === 'file' ? a.name.split('.').pop()?.toLowerCase() ?? '' : '';
          const extB = b.type === 'file' ? b.name.split('.').pop()?.toLowerCase() ?? '' : '';
          compare = extA.localeCompare(extB);
          break;
      }
      return sortDir === 'asc' ? compare : -compare;
    });
  });
  
  statusBarText = computed(() => {
    const total = this.displayContents().length;
    const selected = this.selectedNode();
    if (selected) {
        const size = selected.size > 0 ? this.formatBytes(selected.size) : '';
        return `1 item selected ${size ? ` | ${size}` : ''}`;
    }
    return `${total} items`;
  });

  constructor() {
    effect(() => {
      const path = this.currentPath();
      const dir = this.fsService.getDirectory(path);
      if (dir) {
        this.contents.set(Object.values(dir.children));
      }
    });

    effect(() => {
        if (this.modalState() && this.modalInputField) {
            setTimeout(() => this.modalInputField.nativeElement.focus(), 50);
        }
    });

    this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'file-explorer' && action.action === 'createFile') {
          const { parentPath, fileName, content } = action.payload;
          const success = this.fsService.createFile(parentPath, fileName, content || '');
          if (success) {
            this.notificationService.show({ appId: 'file-explorer', title: 'Copilot Action', body: `File "${fileName}" created in ${parentPath}.`, type: 'success' });
          } else {
            this.notificationService.show({ appId: 'file-explorer', title: 'Copilot Action', body: `Failed to create file "${fileName}". It may already exist.`, type: 'error' });
          }
        }
      });
  }

  ngOnInit() {
    const pathFromContext = this.context?.path;
    if (pathFromContext && this.fsService.getDirectory(pathFromContext)) {
      this.currentPath.set(pathFromContext);
    }
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
      this.selectedNode.set(null);
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
        case 'txt': case 'md': case 'js': case 'ts': case 'json': case 'html': case 'css':
          appId = 'text-editor';
          break;
        case 'jpg': case 'jpeg': case 'png': case 'gif':
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
  
  onNodeContextMenu(event: MouseEvent, node: FileSystemNode) {
    event.preventDefault();
    event.stopPropagation();
    this.selectNode(node);
    this.contextMenu.set({ visible: true, x: event.clientX, y: event.clientY, node });
  }

  onBackgroundContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.deselect();
    this.contextMenu.set({ visible: true, x: event.clientX, y: event.clientY, node: null });
  }
  
  closeContextMenu() {
    this.contextMenu.update(cm => ({ ...cm, visible: false }));
  }
  
  contextMenuOpen() {
    const node = this.contextMenu().node;
    if (node) this.handleDoubleClick(node);
    this.closeContextMenu();
  }

  getIconForNode(node: FileSystemNode): string {
    if (node.type === 'directory') return 'fas fa-folder text-yellow-400';
    const extension = node.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt': case 'md': return 'fas fa-file-alt text-gray-300';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'fas fa-file-image text-blue-400';
      case 'js': case 'ts': case 'json': case 'html': case 'css': return 'fas fa-file-code text-green-400';
      case 'pdf': return 'fas fa-file-pdf text-red-500';
      case 'sys': case 'bin': return 'fas fa-cogs text-gray-500';
      default: return 'fas fa-file text-gray-400';
    }
  }
  
  requestNewFolder() {
    this.modalInput.set('New Folder');
    this.modalState.set({ type: 'newFolder' });
    this.closeContextMenu();
  }

  requestNewFile() {
    this.modalInput.set('new-file.txt');
    this.modalState.set({ type: 'newFile' });
    this.closeContextMenu();
  }
  
  requestRename() {
    const node = this.selectedNode();
    if (!node) return;
    this.modalInput.set(node.name);
    this.modalState.set({ type: 'rename', node });
    this.closeContextMenu();
  }

  requestDelete() {
    const node = this.selectedNode();
    if (!node) return;
    this.modalState.set({ type: 'delete', node });
    this.closeContextMenu();
  }

  closeModal() {
    this.modalState.set(null);
    this.modalInput.set('');
  }

  confirmModalAction() {
    const state = this.modalState();
    if (!state) return;
    const name = this.modalInput().trim();
    let success = false;
    let message = '';
    
    switch (state.type) {
      case 'newFile':
        if (!name) { message = 'File name cannot be empty.'; break; }
        success = this.fsService.createFile(this.currentPath(), name, '');
        message = success ? `File "${name}" created.` : 'Failed to create file. It may already exist.';
        break;
      case 'newFolder':
        if (!name) { message = 'Folder name cannot be empty.'; break; }
        success = this.fsService.createDirectory(this.currentPath(), name);
        message = success ? `Folder "${name}" created.` : 'Failed to create folder. It may already exist.';
        break;
      case 'rename':
        if (!name) { message = 'Name cannot be empty.'; break; }
        if (state.node && name !== state.node.name) {
          success = this.fsService.renameNode(state.node.path, name);
          message = success ? 'Item renamed.' : 'Failed to rename. Name might already exist.';
        }
        break;
      case 'delete':
        if (state.node) {
          success = this.fsService.deleteNode(state.node.path);
          message = success ? 'Item deleted.' : 'Failed to delete item.';
        }
        break;
    }

    if (message) {
      this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: message, type: success ? 'success' : 'error' });
    }
    
    if (success) this.selectedNode.set(null);
    this.closeModal();
  }

  cutSelectedNode() {
    const node = this.selectedNode();
    if (node) this.clipboard.set({ node, action: 'cut' });
    this.closeContextMenu();
  }

  copySelectedNode() {
    const node = this.selectedNode();
    if (node) this.clipboard.set({ node, action: 'copy' });
    this.closeContextMenu();
  }

  paste() {
    const clipboardItem = this.clipboard();
    if (!clipboardItem) return;

    if (clipboardItem.action === 'cut') {
      const success = this.fsService.moveNode(clipboardItem.node.path, this.currentPath());
      if (success) {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Item moved.', type: 'success' });
        this.clipboard.set(null);
      } else {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Could not move item here.', type: 'error' });
      }
    } else {
      const success = this.fsService.copyNode(clipboardItem.node.path, this.currentPath());
      if (success) {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Item copied.', type: 'success' });
      } else {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Could not copy item here.', type: 'error' });
      }
    }
    this.closeContextMenu();
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
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: 'Upload failed. File may already exist.', type: 'error' });
      }
    };
    
    reader.onerror = () => {
        this.notificationService.show({ appId: 'file-explorer', title: 'File Explorer', body: `Error reading file "${file.name}".`, type: 'error' });
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    input.value = '';
  }
  
  toggleSortDirection() {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  }

  cycleSortBy() {
    const SORTS: Array<'name' | 'size' | 'date' | 'type'> = ['name', 'size', 'date', 'type'];
    const currentIndex = SORTS.indexOf(this.sortBy());
    const nextIndex = (currentIndex + 1) % SORTS.length;
    this.sortBy.set(SORTS[nextIndex]);
  }
  
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  getFileType(node: FileSystemNode): string {
    if (node.type === 'directory') return 'Folder';
    return node.name.split('.').pop()?.toUpperCase() + ' File' || 'File';
  }
}