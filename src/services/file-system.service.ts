

import { Injectable, signal, effect } from '@angular/core';

const FS_LOCAL_STORAGE_KEY = 'banana-os-filesystem';

// Fix: Refactored FileSystemNode to be a discriminated union type. This fixes excess property errors in
// object literals when defining the initial file system, and allows for better type narrowing.
export interface FileSystemFile {
  name: string;
  path: string;
  type: 'file';
  content: string;
}

export interface FileSystemDirectory {
  name: string;
  path: string;
  type: 'directory';
  children: { [name: string]: FileSystemNode };
}

export type FileSystemNode = FileSystemFile | FileSystemDirectory;


// --- SOURCE CODE FOR VIRTUAL FILE SYSTEM ---

const defaultImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAHhJREFUeJzt0DEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAn2AAB2G1p5AAAAABJRU5ErkJggg==';

// --- CORE OS FILES ---
const APP_COMPONENT_TS = `import { Component, ChangeDetectionStrategy, signal, effect, inject, Renderer2, PLATFORM_ID, OnDestroy, computed, Injector, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { WindowComponent } from './components/window/window.component';
import { AppWindow } from './models/window.model';
import { APPS_CONFIG } from './config/apps.config';
import { SettingsService } from './services/settings.service';
import { AppManagementService } from './services/app-management.service';
import { OsInteractionService, CodeRepairPayload } from './services/os-interaction.service';
import { WINDOW_CONTEXT } from './injection-tokens';
import { DesktopStateService } from './services/desktop-state.service';
import { NotificationService } from './services/notification.service';
import { FileSystemService } from './services/file-system.service';

// Import all app components
import { TerminalComponent } from './components/apps/terminal/terminal.component';
import { SettingsComponent } from './components/apps/settings/settings.component';
import { BrowserComponent } from './components/apps/browser/browser.component';
import { CalculatorComponent } from './components/apps/calculator/calculator.component';
import { WeatherComponent } from './components/apps/weather/weather.component';
import { CameraComponent } from './components/apps/camera/camera.component';
import { FileExplorerComponent } from './components/apps/file-explorer/file-explorer.component';
import { TextEditorComponent } from './components/apps/text-editor/text-editor.component';
import { PhotoViewerComponent } from './components/apps/photo-viewer/photo-viewer.component';
import { StoreComponent } from './components/apps/store/store.component';
import { PlaceholderAppComponent } from './components/apps/placeholder/placeholder.component';
import { NotesComponent } from './components/apps/notes/notes.component';
import { SystemMonitorComponent } from './components/apps/system-monitor/system-monitor.component';
import { CalendarComponent } from './components/apps/calendar/calendar.component';
import { ClockComponent } from './components/apps/clock/clock.component';
import { MapsComponent } from './components/apps/maps/maps.component';
import { PdfReaderComponent } from './components/apps/pdf-reader/pdf-reader.component';
import { TranslatorComponent } from './components/apps/translator/translator.component';
import { CopilotComponent } from './components/apps/copilot/copilot.component';
import { NotificationCenterComponent } from './components/notification-center/notification-center.component';
import { MusicPlayerComponent } from './components/apps/music-player/music-player.component';
import { MarkdownEditorComponent } from './components/apps/markdown-editor/markdown-editor.component';
import { PodcastsComponent } from './components/apps/podcasts/podcasts.component';
import { ChessComponent } from './components/apps/chess/chess.component';
import { SolitaireComponent } from './components/apps/solitaire/solitaire.component';
import { MinesweeperComponent } from './components/apps/minesweeper/minesweeper.component';
import { SudokuComponent } from './components/apps/sudoku/sudoku.component';
import { PuzzleBlocksComponent } from './components/apps/puzzle-blocks/puzzle-blocks.component';
import { Game2048Component } from './components/apps/2048/2048.component';
import { WordFinderComponent } from './components/apps/word-finder/word-finder.component';
import { RecipeBookComponent } from './components/apps/recipe-book/recipe-book.component';
import { StocksComponent } from './components/apps/stocks/stocks.component';
import { NewsFeedComponent } from './components/apps/news-feed/news-feed.component';
import { ForumsComponent } from './components/apps/forums/forums.component';
import { BananaIdeComponent } from './components/apps/banana-ide/banana-ide.component';

// Types for persisting window state in localStorage
type SerializableAppWindow = Omit<AppWindow, 'component' | 'injector'>;
interface WindowsState {
  windows: SerializableAppWindow[];
  activeWindowId: string | null;
  nextZIndex: number;
}
const WINDOWS_STATE_KEY = 'banana-os-windows-state';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, WindowComponent, TerminalComponent, SettingsComponent, BrowserComponent,
    CalculatorComponent, WeatherComponent, CameraComponent, FileExplorerComponent, TextEditorComponent,
    PhotoViewerComponent, StoreComponent, PlaceholderAppComponent, NotesComponent, 
    SystemMonitorComponent, CalendarComponent, ClockComponent, MapsComponent, PdfReaderComponent, TranslatorComponent,
    CopilotComponent, NotificationCenterComponent, MusicPlayerComponent, MarkdownEditorComponent, PodcastsComponent,
    ChessComponent, SolitaireComponent, MinesweeperComponent, SudokuComponent, PuzzleBlocksComponent, Game2048Component,
    WordFinderComponent, RecipeBookComponent, StocksComponent, NewsFeedComponent,
    ForumsComponent, BananaIdeComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private document: Document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  
  settingsService = inject(SettingsService);
  appManagementService = inject(AppManagementService);
  osInteraction = inject(OsInteractionService);
  notificationService = inject(NotificationService);
  private desktopStateService = inject(DesktopStateService);
  private fsService = inject(FileSystemService);
  
  windows = signal<AppWindow[]>([]);
  activeWindowId = signal<string | null>(null);
  nextZIndex = signal(10);
  isStartMenuOpen = signal(false);
  isRestarting = signal(false);
  isFactoryResetConfirmOpen = signal(false);
  isNotificationCenterOpen = signal(false);

  // For Self-Healing
  isCodeRepairConfirmOpen = signal(false);
  codeRepairPayload = signal<CodeRepairPayload | null>(null);
  
  currentTime = signal(new Date());
  private clockInterval: any;

  private allApps = APPS_CONFIG;
  installedApps = computed(() => 
    this.allApps.filter(app => this.appManagementService.isAppInstalled(app.id))
  );
  
  unreadCount = this.notificationService.unreadCount;

  // For Keyboard Shortcuts
  isAppSwitcherVisible = signal(false);
  appSwitcherSelectionIndex = signal(0);
  private unlistenKeyDown!: () => void;
  private unlistenKeyUp!: () => void;
  
  windowsForSwitcher = computed(() => {
    return this.windows().filter(w => w.state !== 'minimized').slice().sort((a, b) => b.zIndex - a.zIndex);
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
        this.loadState(); // Load state from localStorage

        this.clockInterval = setInterval(() => {
            this.currentTime.set(new Date());
        }, 1000);

        this.osInteraction.openAppRequest.subscribe(({ appId, data }) => {
            this.openApp(appId, data);
        });
        
        this.osInteraction.updateWindowTitle.subscribe(({ windowId, newTitle }) => {
            this.windows.update(windows => 
                windows.map(w => w.id === windowId ? { ...w, title: newTitle } : w)
            );
        });

        this.osInteraction.factoryResetRequest.subscribe(() => {
          this.performFactoryReset();
        });

        this.osInteraction.restartRequest.subscribe(() => {
          this.isRestarting.set(true);
          // Clear the window state from localStorage so it's fresh on "reload"
          localStorage.removeItem(WINDOWS_STATE_KEY); 
          
          setTimeout(() => {
            // Reset all open windows and UI state
            this.windows.set([]);
            this.activeWindowId.set(null);
            this.nextZIndex.set(10);
            this.isStartMenuOpen.set(false);
            this.isNotificationCenterOpen.set(false);
            this.isCodeRepairConfirmOpen.set(false);
            this.codeRepairPayload.set(null);
            
            // Hide the overlay
            this.isRestarting.set(false);

            // Notify the user that the restart is complete
            this.notificationService.show({
              appId: 'banana-copilot',
              title: 'System Restart',
              body: 'Banana OS has restarted successfully.',
              type: 'info'
            });
          }, 3000);
        });

        this.osInteraction.copilotActionRequest.subscribe(action => {
          this.handleCopilotAction(action);
        });

        this.osInteraction.codeRepairRequest.subscribe(payload => {
          this.handleCodeRepairRequest(payload);
        });

        // This effect runs whenever window state changes and saves it.
        effect(() => {
            if (this.isRestarting()) return;
            const state: WindowsState = {
                windows: this.windows().map(w => {
                    const { component, injector, ...serializableWindow } = w;
                    return serializableWindow;
                }),
                activeWindowId: this.activeWindowId(),
                nextZIndex: this.nextZIndex(),
            };
            localStorage.setItem(WINDOWS_STATE_KEY, JSON.stringify(state));
        });
        
        effect(() => {
            this.desktopStateService.openWindows.set(this.windows());
        });

        effect(() => {
            const wallpaperValue = this.settingsService.wallpaper();
            this.document.body.classList.forEach(className => {
                if (className.startsWith('wallpaper-')) this.renderer.removeClass(this.document.body, className);
            });
            this.renderer.setStyle(this.document.body, 'background-image', '');

            if (wallpaperValue.startsWith('data:image')) {
                this.renderer.setStyle(this.document.body, 'background-image', \`url(\${wallpaperValue})\`);
                this.renderer.setStyle(this.document.body, 'background-size', 'cover');
                this.renderer.setStyle(this.document.body, 'background-position', 'center');
            } else {
                this.renderer.addClass(this.document.body, wallpaperValue);
            }
        });
        
        effect(() => {
            const color = this.settingsService.accentColor();
            this.document.documentElement.style.setProperty('--accent-color', \`var(--accent-color-\${color})\`);
        });
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.unlistenKeyDown = this.renderer.listen(this.document, 'keydown', this.handleKeyDown.bind(this));
      this.unlistenKeyUp = this.renderer.listen(this.document, 'keyup', this.handleKeyUp.bind(this));
    }
  }

  toggleNotificationCenter() {
    this.isNotificationCenterOpen.update(v => !v);
    if (this.isNotificationCenterOpen()) this.notificationService.markAllAsRead();
  }

  formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return \`\${minutes}m ago\`;
    const hours = Math.floor(minutes / 60);
    return \`\${hours}h ago\`;
  }

  private handleCopilotAction(action: { action: string, [key: string]: any }) {
    switch(action.action) {
      case 'openApp': this.openApp(action.appId); break;
      case 'setWallpaper': this.settingsService.setWallpaper(action.wallpaperId); break;
      case 'setAccentColor': this.settingsService.setAccentColor(action.color); break;
      case 'restart': this.osInteraction.restartRequest.next(); break;
      case 'factoryReset': this.requestFactoryReset(); break;
    }
  }

  private handleCodeRepairRequest(payload: CodeRepairPayload) {
    if (payload.filePath.includes('copilot.component.')) {
      this.notificationService.show({
        appId: 'banana-copilot',
        title: 'Security Alert',
        body: 'For system stability, Copilot cannot modify its own source code.',
        type: 'error'
      });
      return;
    }
    this.codeRepairPayload.set(payload);
    this.isCodeRepairConfirmOpen.set(true);
  }

  confirmCodeRepair() {
    const payload = this.codeRepairPayload();
    if (!payload) return;
    
    const success = this.fsService.writeFile(payload.filePath, payload.codePatch);
    if (success) {
      this.notificationService.show({
        appId: 'banana-copilot',
        title: 'Self-Healing',
        body: 'Code patch applied successfully. Restarting system to apply changes.',
        type: 'success'
      });
      this.osInteraction.restartRequest.next();
    } else {
      this.notificationService.show({
        appId: 'banana-copilot',
        title: 'Self-Healing Failed',
        body: \`Could not write changes to \${payload.filePath}.\`,
        type: 'error'
      });
    }
    this.cancelCodeRepair();
  }

  cancelCodeRepair() {
    this.isCodeRepairConfirmOpen.set(false);
    this.codeRepairPayload.set(null);
  }

  private performFactoryReset() {
    this.windows.set([]);
    this.appManagementService.uninstallAllNonCoreApps();
    this.settingsService.resetToDefaults();
    this.activeWindowId.set(null);
    this.nextZIndex.set(10);
  }

  requestFactoryReset() { this.isFactoryResetConfirmOpen.set(true); }
  cancelFactoryReset() { this.isFactoryResetConfirmOpen.set(false); }
  confirmFactoryReset() {
    this.performFactoryReset();
    this.isFactoryResetConfirmOpen.set(false);
  }

  private loadState() {
      const savedStateJSON = localStorage.getItem(WINDOWS_STATE_KEY);
      if (savedStateJSON) {
          try {
              const savedState: WindowsState = JSON.parse(savedStateJSON);
              const reconstructedWindows = savedState.windows
                .map(sw => {
                  const appConfig = this.allApps.find(app => app.id === sw.appId);
                  if (!appConfig) return null;
                  return { ...sw, component: appConfig.component };
                })
                .filter((w): w is AppWindow => w !== null);

              this.windows.set(reconstructedWindows);
              this.activeWindowId.set(savedState.activeWindowId);
              this.nextZIndex.set(savedState.nextZIndex || 10);
          } catch (e) {
              localStorage.removeItem(WINDOWS_STATE_KEY);
          }
      }
  }

  ngOnDestroy() {
      if (this.clockInterval) clearInterval(this.clockInterval);
      // Clean up subscriptions
      if (this.unlistenKeyDown) this.unlistenKeyDown();
      if (this.unlistenKeyUp) this.unlistenKeyUp();
  }

  openApp(appId: string, data?: any) {
    this.isStartMenuOpen.set(false);
    
    if (!data) {
        const existingWindow = this.windows().find(w => w.appId === appId && w.state !== 'minimized');
        if (existingWindow) { this.focusWindow(existingWindow.id); return; }

        const minimized = this.windows().find(w => w.appId === appId && w.state === 'minimized');
        if (minimized) { this.restoreWindow(minimized.id); return; }
    }
    
    const appConfig = this.allApps.find(app => app.id === appId);
    if (!appConfig) return;

    const newWindowId = \`win-\${Date.now()}\`;
    const newZIndex = this.nextZIndex();
    const defaultSize = appConfig.defaultSize || { width: 600, height: 400 };

    let customInjector: Injector | undefined;
    if (data) {
        data.windowId = newWindowId;
        customInjector = Injector.create({ providers: [{ provide: WINDOW_CONTEXT, useValue: data }], parent: this.injector });
    }

    const newWindow: AppWindow = {
      id: newWindowId,
      appId: appConfig.id,
      title: appConfig.title,
      icon: appConfig.icon,
      component: appConfig.component,
      position: { x: 50 + (this.windows().length % 10) * 20, y: 50 + (this.windows().length % 10) * 20 },
      size: defaultSize,
      zIndex: newZIndex,
      isMinimized: false, isMaximized: false, state: 'default', injector: customInjector
    };

    this.windows.update(w => [...w, newWindow]);
    this.activeWindowId.set(newWindowId);
    this.nextZIndex.update(z => z + 1);
  }

  closeWindow(id: string) {
    this.windows.update(w => w.filter(win => win.id !== id));
    if (this.activeWindowId() === id) {
      const remaining = this.windows();
      this.activeWindowId.set(remaining.length > 0 ? remaining.slice().sort((a,b) => b.zIndex - a.zIndex)[0].id : null);
    }
  }

  focusWindow(id: string) {
    if (this.activeWindowId() === id) return;
    const newZIndex = this.nextZIndex();
    this.windows.update(w => w.map(win => win.id === id ? { ...win, zIndex: newZIndex } : win));
    this.activeWindowId.set(id);
    this.nextZIndex.update(z => z + 1);
  }

  minimizeWindow(id: string) {
    this.windows.update(w => w.map(win => win.id === id ? { ...win, state: 'minimized' } : win));
    if (this.activeWindowId() === id) this.activeWindowId.set(null);
  }
  
  restoreWindow(id: string) {
      this.windows.update(w => w.map(win => win.id === id ? { ...win, state: win.isMaximized ? 'maximized' : 'default' } : win));
      this.focusWindow(id);
  }

  toggleMaximize(id: string) {
      this.windows.update(w => w.map(win => {
          if (win.id === id) {
              if (win.state === 'maximized') {
                  return { ...win, ...win.previousState, state: 'default', isMaximized: false };
              } else {
                  return { 
                      ...win, state: 'maximized', isMaximized: true,
                      previousState: { position: win.position, size: win.size },
                      position: { x: 0, y: 0 },
                      size: { width: window.innerWidth, height: window.innerHeight - 52 }
                  };
              }
          }
          return win;
      }));
      this.focusWindow(id);
  }

  updateWindowPosition(id: string, position: { x: number, y: number }) {
      this.windows.update(w => w.map(win => win.id === id ? { ...win, position } : win));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Meta' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      this.isStartMenuOpen.update(v => !v);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
      event.preventDefault();
      if (this.activeWindowId()) this.closeWindow(this.activeWindowId()!);
      return;
    }
    if (event.altKey && event.key === 'Tab') {
      event.preventDefault();
      const switcherWindows = this.windowsForSwitcher();
      if (switcherWindows.length > 1) {
        if (!this.isAppSwitcherVisible()) {
          this.isAppSwitcherVisible.set(true);
          this.appSwitcherSelectionIndex.set(1);
        } else {
          this.appSwitcherSelectionIndex.update(index => (index + 1) % switcherWindows.length);
        }
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Alt' && this.isAppSwitcherVisible()) {
      const selected = this.windowsForSwitcher()[this.appSwitcherSelectionIndex()];
      if (selected) this.focusWindow(selected.id);
      this.isAppSwitcherVisible.set(false);
      this.appSwitcherSelectionIndex.set(0);
    }
  }
}`;
const APP_COMPONENT_HTML = `<!-- Desktop Area -->
<div class="h-screen w-screen overflow-hidden select-none text-white flex flex-col">

  <!-- Desktop Icons -->
  <main class="flex-1 p-4">
    <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
      @for (app of installedApps(); track app.id) {
        <div (dblclick)="openApp(app.id)" class="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors duration-200">
          <i class="text-4xl mb-2" [ngClass]="app.icon"></i>
          <span class="text-center text-xs break-words">{{ app.title }}</span>
        </div>
      }
    </div>
  </main>
  
  <!-- App Windows -->
  @for (win of windows(); track win.id) {
    <app-window [window]="win"
                [isActive]="activeWindowId() === win.id"
                (close)="closeWindow(win.id)"
                (minimize)="minimizeWindow(win.id)"
                (maximize)="toggleMaximize(win.id)"
                (onFocus)="focusWindow(win.id)"
                (drag)="updateWindowPosition(win.id, $event)" />
  }

  <!-- Notification Toasts -->
  <app-notification-center></app-notification-center>

  <!-- Notification Center Panel -->
  @if (isNotificationCenterOpen()) {
    <div (click)="isNotificationCenterOpen.set(false)" class="absolute inset-0 z-40"></div>
    <div class="absolute top-0 right-0 bottom-14 w-96 bg-gray-800/70 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl flex flex-col z-50 animate-slide-in-right-panel">
        <header class="flex-shrink-0 p-4 flex items-center justify-between border-b border-gray-700/50">
            <h3 class="text-lg font-bold">Notifications</h3>
            @if (notificationService.notifications().length > 0) {
                <button (click)="notificationService.clearAll()" class="text-sm text-blue-400 hover:underline">Clear All</button>
            }
        </header>
        <div class="flex-1 overflow-y-auto">
            @if (notificationService.notifications().length > 0) {
                @for (notification of notificationService.notifications(); track notification.id) {
                    <div class="p-4 border-b border-gray-700/50 hover:bg-white/5 relative group">
                        <div class="flex items-start gap-3">
                            <i class="text-lg mt-1" [ngClass]="notification.appIcon"></i>
                            <div class="flex-1">
                                <p class="font-semibold text-white">{{ notification.title }}</p>
                                <p class="text-sm text-gray-300">{{ notification.body }}</p>
                                <p class="text-xs text-gray-500 mt-1">{{ formatTimeAgo(notification.timestamp) }}</p>
                            </div>
                        </div>
                        <button (click)="notificationService.remove(notification.id)" class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-gray-700/50 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                }
            } @else {
                <div class="h-full flex flex-col items-center justify-center text-gray-500">
                    <i class="fas fa-bell-slash text-4xl mb-2"></i>
                    <p>No new notifications</p>
                </div>
            }
        </div>
    </div>
  }

  <!-- Start Menu -->
  @if (isStartMenuOpen()) {
    <div (click)="isStartMenuOpen.set(false)" class="absolute inset-0 z-40"></div>
    <div class="absolute bottom-[52px] left-2 w-80 bg-gray-800/70 backdrop-blur-xl border border-gray-700/50 rounded-lg shadow-2xl p-4 z-50 animate-fade-in-up">
        <div class="grid grid-cols-4 gap-4">
           @for (app of installedApps(); track app.id) {
            <div (click)="openApp(app.id)" class="flex flex-col items-center p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors duration-200">
              <i class="text-3xl mb-1" [ngClass]="app.icon"></i>
              <span class="text-center text-xs break-words">{{ app.title }}</span>
            </div>
          }
        </div>
    </div>
  }

  <!-- App Switcher -->
  @if (isAppSwitcherVisible()) {
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center animate-fade-in">
      <div class="flex gap-4 p-4 bg-gray-800/70 rounded-lg border border-gray-700/50">
        @for (win of windowsForSwitcher(); track win.id; let i = $index) {
          <div class="flex flex-col items-center p-3 rounded-lg w-24 h-24 justify-center transition-colors"
               [class.bg-blue-500/50]="appSwitcherSelectionIndex() === i">
            <i class="text-4xl mb-2" [ngClass]="win.icon"></i>
            <span class="text-center text-xs truncate w-full">{{ win.title }}</span>
          </div>
        }
      </div>
    </div>
  }

  <!-- Taskbar -->
  <footer class="h-[52px] w-full bg-gray-900/50 backdrop-blur-lg border-t border-gray-700/50 flex items-center justify-between px-2 z-30 flex-shrink-0">
    <div class="flex items-center gap-2">
      <button (click)="isStartMenuOpen.set(!isStartMenuOpen())" 
              class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors accent-bg">
        <i class="fas fa-bars"></i>
      </button>

      <button (click)="requestFactoryReset()" 
              title="Factory Reset"
              class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-500/50 bg-red-800/50 text-red-300 hover:text-white transition-colors">
        <i class="fas fa-power-off"></i>
      </button>

      <!-- Pinned/Open Apps -->
      @for (win of windows(); track win.id) {
        <button (click)="win.state === 'minimized' ? restoreWindow(win.id) : focusWindow(win.id)"
                [class.bg-white/20]="activeWindowId() === win.id"
                [class.border-b-2]="win.state !== 'minimized'"
                class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200 accent-border">
          <i class="text-xl" [ngClass]="win.icon"></i>
        </button>
      }
    </div>

    <div class="flex items-center gap-2">
      <div class="text-sm text-center">
        <div>{{ currentTime() | date:'h:mm:ss a' }}</div>
        <div class="text-xs text-gray-400">{{ currentTime() | date:'MMM d, y' }}</div>
      </div>
      <!-- Notification Button -->
      <div class="relative">
          <button (click)="toggleNotificationCenter()" class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
              <i class="fas fa-bell"></i>
          </button>
          @if (unreadCount() > 0) {
              <div class="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center border-2 border-gray-900/50 font-bold">
                  {{ unreadCount() }}
              </div>
          }
      </div>
    </div>
  </footer>
</div>

<!-- Restart Overlay -->
@if(isRestarting()) {
  <div class="absolute inset-0 bg-black z-[1000] flex flex-col items-center justify-center animate-fade-in">
      <i class="fas fa-power-off text-5xl mb-4"></i>
      <h2 class="text-3xl font-bold">Restarting...</h2>
  </div>
}

<!-- Factory Reset Confirmation Modal -->
@if(isFactoryResetConfirmOpen()) {
  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
    <div class="bg-gray-800 rounded-lg shadow-2xl p-6 w-96 border border-gray-700 animate-fade-in">
      <h3 class="text-xl font-bold mb-2">Confirm Factory Reset</h3>
      <p class="text-gray-400 mb-6">Are you sure you want to proceed? All custom settings and installed apps will be permanently deleted.</p>
      <div class="flex justify-end gap-4">
        <button (click)="cancelFactoryReset()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
        <button (click)="confirmFactoryReset()" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md">Confirm Reset</button>
      </div>
    </div>
  </div>
}

<!-- Code Repair Confirmation Modal -->
@if(isCodeRepairConfirmOpen() && codeRepairPayload(); as payload) {
  <div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
    <div class="bg-gray-800 rounded-lg shadow-2xl p-6 w-[500px] border border-gray-700 animate-fade-in">
      <h3 class="text-xl font-bold mb-2 flex items-center gap-2"><i class="fas fa-wrench text-yellow-400"></i>Confirm Code Repair</h3>
      <p class="text-gray-400 mb-4">Banana Copilot suggests a fix for the following issue:</p>
      <div class="bg-gray-900/50 p-3 rounded-md mb-4">
        <p class="text-sm italic">"{{ payload.description }}"</p>
      </div>
      <p class="text-gray-400 mb-1">This will modify the file:</p>
      <p class="font-mono bg-gray-900/50 p-2 rounded-md text-sm text-yellow-300 mb-6">{{ payload.filePath }}</p>
      <p class="text-sm text-yellow-400/80 mb-6"><i class="fas fa-exclamation-triangle mr-2"></i>Applying this patch will require a system restart.</p>
      <div class="flex justify-end gap-4">
        <button (click)="cancelCodeRepair()" class="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
        <button (click)="confirmCodeRepair()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md">Apply & Restart</button>
      </div>
    </div>
  </div>
}

<style>
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.2s ease-out;
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  @keyframes slide-in-right-panel {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .animate-slide-in-right-panel {
    animation: slide-in-right-panel 0.3s ease-out;
  }
</style>
`;
const WINDOW_COMPONENT_TS = `import { Component, input, output, effect, viewChild, ElementRef, Renderer2, inject, signal } from '@angular/core';
import { AppWindow } from '../../../models/window.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  imports: [CommonModule],
  host: {
    '[style.width.px]': 'window().size.width',
    '[style.height.px]': 'window().size.height',
    '[style.transform]': "'translate(' + window().position.x + 'px, ' + window().position.y + 'px)'",
    '[style.zIndex]': 'window().zIndex',
    '[class.transition-all]': '!isDragging()',
    '[class.duration-200]': '!isDragging()',
    '[class.opacity-0]': 'window().state === "minimized"',
    '[class.scale-95]': 'window().state === "minimized"',
    '[class.shadow-2xl]': 'isActive()',
    '[class.shadow-lg]': '!isActive()',
    '(mousedown)': 'onFocus.emit()',
    'class': 'absolute top-0 left-0 bg-gray-800 border border-gray-700/50 rounded-lg shadow-lg overflow-hidden flex flex-col',
  }
})
export class WindowComponent {
  window = input.required<AppWindow>();
  isActive = input.required<boolean>();
  
  close = output<void>();
  minimize = output<void>();
  maximize = output<void>();
  onFocus = output<void>();
  drag = output<{ x: number, y: number }>();

  isDragging = signal(false);
  private renderer = inject(Renderer2);
  private dragUnlistenMouseMove!: () => void;
  private dragUnlistenMouseUp!: () => void;
  
  headerEl = viewChild.required<ElementRef<HTMLDivElement>>('headerEl');

  constructor() {
    effect(() => {
        const header = this.headerEl().nativeElement;
        header.addEventListener('mousedown', this.dragMouseDown);
    });
  }
  
  dragMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag on buttons
    e.preventDefault();
    this.isDragging.set(true);

    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialWinX = this.window().position.x;
    const initialWinY = this.window().position.y;
    
    this.dragUnlistenMouseMove = this.renderer.listen('document', 'mousemove', (event: MouseEvent) => {
      event.preventDefault();
      const dx = event.clientX - initialX;
      const dy = event.clientY - initialY;
      this.drag.emit({ x: initialWinX + dx, y: initialWinY + dy });
    });

    this.dragUnlistenMouseUp = this.renderer.listen('document', 'mouseup', () => {
      this.isDragging.set(false);
      this.dragUnlistenMouseMove();
      this.dragUnlistenMouseUp();
    });
  };
}`;
const WINDOW_COMPONENT_HTML = `<div #headerEl 
     [class.bg-gray-700/80]="isActive()"
     [class.bg-gray-900/50]="!isActive()"
     class="flex-shrink-0 h-10 px-3 py-2 flex justify-between items-center cursor-move backdrop-blur-md border-b border-gray-700/50 transition-colors">
  <div class="flex items-center gap-2">
    <i class="app-icon text-lg" [ngClass]="window().icon"></i>
    <span class="app-title font-medium text-gray-200">{{ window().title }}</span>
  </div>
  <div class="flex space-x-2">
    <button (click)="minimize.emit()" title="Minimize" class="w-7 h-7 flex items-center justify-center hover:bg-gray-600 rounded-full transition-colors">
      <i class="fas fa-minus text-xs"></i>
    </button>
    <button (click)="maximize.emit()" title="Maximize" class="w-7 h-7 flex items-center justify-center hover:bg-gray-600 rounded-full transition-colors">
      @if (window().state === 'maximized') {
        <i class="far fa-window-restore text-xs"></i>
      } @else {
        <i class="far fa-square text-xs"></i>
      }
    </button>
    <button (click)="close.emit()" title="Close" class="w-7 h-7 flex items-center justify-center hover:bg-red-600 rounded-full transition-colors">
      <i class="fas fa-times text-sm"></i>
    </button>
  </div>
</div>
<div class="app-content flex-1 h-full overflow-auto">
  <ng-container [ngComponentOutlet]="window().component" [ngComponentOutletInjector]="window().injector"></ng-container>
</div>`;
const OS_INTERACTION_SERVICE_TS = `import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CopilotAction {
  action: string;
  [key: string]: any;
}

export interface InAppAction {
    appId: string;
    action: string;
    payload: { [key: string]: any };
}

export interface CodeRepairPayload {
  filePath: string;
  codePatch: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class OsInteractionService {
  // Subject to request opening an app
  openAppRequest = new Subject<{ appId: string, data?: any }>();
  
  // Subject to update a window's title
  updateWindowTitle = new Subject<{ windowId: string, newTitle: string }>();

  // Subject to request a factory reset
  factoryResetRequest = new Subject<void>();

  // Subject to request a system restart
  restartRequest = new Subject<void>();

  // Subject for AI Copilot OS-level commands
  copilotActionRequest = new Subject<CopilotAction>();

  // Subject for AI Copilot in-app commands
  inAppActionRequest = new Subject<InAppAction>();

  // Subject for AI Copilot to request code repairs
  codeRepairRequest = new Subject<CodeRepairPayload>();
}`;
const APP_MANAGEMENT_SERVICE_TS = `
import { Injectable, signal, effect } from '@angular/core';
import { APPS_CONFIG } from '../config/apps.config';

const LOCAL_STORAGE_KEY = 'banana-os-installed-apps';

@Injectable({ providedIn: 'root' })
export class AppManagementService {
  private readonly coreAppIds = APPS_CONFIG.filter(app => app.isCore).map(app => app.id);
  
  installedAppIds = signal<string[]>(this.getInitialInstalledApps());

  constructor() {
    effect(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.installedAppIds()));
    });
  }

  private getInitialInstalledApps(): string[] {
    const savedAppsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedAppsJson) {
      try {
        const savedApps = JSON.parse(savedAppsJson) as string[];
        // Ensure core apps are always present
        const fullList = [...new Set([...this.coreAppIds, ...savedApps])];
        return fullList;
      } catch (e) {
        return [...this.coreAppIds];
      }
    }
    return [...this.coreAppIds];
  }

  isAppInstalled(appId: string): boolean {
    return this.installedAppIds().includes(appId);
  }

  installApp(appId: string) {
    if (!this.isAppInstalled(appId)) {
      this.installedAppIds.update(ids => [...ids, appId]);
    }
  }

  uninstallApp(appId: string) {
    if (this.coreAppIds.includes(appId)) {
      console.warn(\`Attempted to uninstall a core app: \${appId}\`);
      return;
    }
    this.installedAppIds.update(ids => ids.filter(id => id !== appId));
  }
  
  uninstallAllNonCoreApps() {
    this.installedAppIds.set([...this.coreAppIds]);
  }
}`;
const SETTINGS_SERVICE_TS = `
import { Injectable, signal, effect } from '@angular/core';

const WALLPAPER_KEY = 'banana-os-wallpaper';
const ACCENT_COLOR_KEY = 'banana-os-accent-color';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  wallpaper = signal<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(WALLPAPER_KEY) || 'wallpaper-default' : 'wallpaper-default'
  );
  accentColor = signal<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(ACCENT_COLOR_KEY) || 'blue' : 'blue'
  );

  constructor() {
    effect(() => {
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem(WALLPAPER_KEY, this.wallpaper());
      }
    });
    effect(() => {
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem(ACCENT_COLOR_KEY, this.accentColor());
      }
    });
  }

  setWallpaper(wallpaperClass: string) {
    this.wallpaper.set(wallpaperClass);
  }

  setAccentColor(color: string) {
    this.accentColor.set(color);
  }

  resetToDefaults() {
    this.setWallpaper('wallpaper-default');
    this.setAccentColor('blue');
  }
}`;

// --- BROWSER APP ---
const BROWSER_COMPONENT_TS = `import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { WINDOW_CONTEXT } from '../../../injection-tokens';

interface BrowserState {
  history: string[];
  currentIndex: number;
}

@Component({
  selector: 'app-browser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private context = inject(WINDOW_CONTEXT, { optional: true });
  
  private readonly defaultUrl = 'https://www.google.com/webhp?igu=1';
  
  state = signal<BrowserState>({
    history: [this.defaultUrl],
    currentIndex: 0,
  });
  
  reloading = signal(false);

  // --- Computed State ---
  currentUrl = computed<SafeResourceUrl>(() => {
    const s = this.state();
    const url = s.history[s.currentIndex];
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
  
  urlInput = computed<string>(() => this.state().history[this.state().currentIndex]);
  canGoBack = computed(() => this.state().currentIndex > 0);
  canGoForward = computed(() => this.state().currentIndex < this.state().history.length - 1);

  ngOnInit() {
    const urlFromContext = this.context?.url;
    if (urlFromContext) {
      this.state.set({ history: [urlFromContext], currentIndex: 0 });
    }
  }

  // --- Actions ---
  navigate(url: string) {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }

    this.state.update(s => {
      // Truncate forward history when navigating to a new page from the past.
      const newHistory = s.history.slice(0, s.currentIndex + 1);
      newHistory.push(finalUrl);
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    });
  }

  onEnter(event: Event) {
    this.navigate((event.target as HTMLInputElement).value);
  }

  goBack() {
    if (this.canGoBack()) {
      this.state.update(s => ({ ...s, currentIndex: s.currentIndex - 1 }));
    }
  }

  goForward() {
    if (this.canGoForward()) {
      this.state.update(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
    }
  }

  reload() {
    // This trick forces the iframe to reload by temporarily removing it from the DOM.
    this.reloading.set(true);
    setTimeout(() => this.reloading.set(false), 20);
  }
}
`;
const BROWSER_COMPONENT_HTML = `<div class="h-full flex flex-col bg-gray-800">
  <div class="flex-shrink-0 p-2 bg-gray-700 flex items-center gap-2">
    <button (click)="goBack()" [disabled]="!canGoBack()" title="Back" class="w-8 h-8 flex items-center justify-center hover:bg-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"><i class="fas fa-arrow-left"></i></button>
    <button (click)="goForward()" [disabled]="!canGoForward()" title="Forward" class="w-8 h-8 flex items-center justify-center hover:bg-gray-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"><i class="fas fa-arrow-right"></i></button>
    <button (click)="reload()" title="Reload" class="w-8 h-8 flex items-center justify-center hover:bg-gray-600 rounded-full"><i class="fas fa-redo"></i></button>
    <div class="flex-1 relative">
      <i class="fas fa-lock text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input type="text" [value]="urlInput()" (change)="onEnter($event)" title="Address Bar" class="w-full bg-gray-900 rounded-full py-1.5 pl-9 pr-3 text-white focus:outline-none focus:ring-2 accent-ring-focus">
    </div>
  </div>
  <div class="flex-1 bg-white">
    @if (!reloading()) {
      <iframe [src]="currentUrl()" class="w-full h-full border-0" title="Web Content"></iframe>
    }
  </div>
</div>
`;

// --- CALCULATOR APP ---
const CALCULATOR_COMPONENT_TS = `
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  display = signal('0');
  private currentVal = '0';
  private operator: string | null = null;
  private firstOperand: number | null = null;
  private waitingForSecondOperand = false;

  onKeyPress(key: string) {
    if (/\d/.test(key)) {
      this.inputDigit(key);
    } else if (key === '.') {
      this.inputDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      this.setOperator(key);
    } else if (key === '=') {
      this.calculate();
    } else if (key === 'AC') {
      this.clear();
    } else if (key === '%') {
      this.inputPercent();
    } else if (key === '+/-') {
      this.toggleSign();
    }
  }

  private inputDigit(digit: string) {
    if (this.waitingForSecondOperand) {
      this.currentVal = digit;
      this.waitingForSecondOperand = false;
    } else {
      this.currentVal = this.currentVal === '0' ? digit : this.currentVal + digit;
    }
    this.display.set(this.currentVal);
  }

  private inputDecimal() {
    if (!this.currentVal.includes('.')) {
      this.currentVal += '.';
    }
    this.display.set(this.currentVal);
  }

  private setOperator(op: string) {
    if (this.firstOperand === null) {
      this.firstOperand = parseFloat(this.currentVal);
    } else if (this.operator) {
      this.calculate();
    }
    this.operator = op;
    this.waitingForSecondOperand = true;
  }

  private calculate() {
    if (this.operator && this.firstOperand !== null) {
      const secondOperand = parseFloat(this.currentVal);
      let result = 0;
      if (this.operator === '+') result = this.firstOperand + secondOperand;
      else if (this.operator === '-') result = this.firstOperand - secondOperand;
      else if (this.operator === '*') result = this.firstOperand * secondOperand;
      else if (this.operator === '/') result = this.firstOperand / secondOperand;

      this.currentVal = String(result);
      this.display.set(this.currentVal);
      this.firstOperand = result;
      this.operator = null;
      this.waitingForSecondOperand = false;
    }
  }
  
  private clear() {
    this.currentVal = '0';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.display.set('0');
  }

  private inputPercent() {
    this.currentVal = String(parseFloat(this.currentVal) / 100);
    this.display.set(this.currentVal);
  }

  private toggleSign() {
    this.currentVal = String(parseFloat(this.currentVal) * -1);
    this.display.set(this.currentVal);
  }
}`;
const CALCULATOR_COMPONENT_HTML = `
<div class="h-full bg-gray-800 flex flex-col p-2 gap-2">
  <div class="text-right text-white text-5xl font-light p-4 bg-gray-900/50 rounded-lg mb-2 overflow-x-auto">
    {{ display() }}
  </div>
  <div class="grid grid-cols-4 gap-2 flex-1">
    <button (click)="onKeyPress('AC')" class="calc-btn bg-gray-500 hover:bg-gray-400">AC</button>
    <button (click)="onKeyPress('+/-')" class="calc-btn bg-gray-500 hover:bg-gray-400">+/-</button>
    <button (click)="onKeyPress('%')" class="calc-btn bg-gray-500 hover:bg-gray-400">%</button>
    <button (click)="onKeyPress('/')" class="calc-btn-op">/</button>
    
    <button (click)="onKeyPress('7')" class="calc-btn">7</button>
    <button (click)="onKeyPress('8')" class="calc-btn">8</button>
    <button (click)="onKeyPress('9')" class="calc-btn">9</button>
    <button (click)="onKeyPress('*')" class="calc-btn-op">x</button>
    
    <button (click)="onKeyPress('4')" class="calc-btn">4</button>
    <button (click)="onKeyPress('5')" class="calc-btn">5</button>
    <button (click)="onKeyPress('6')" class="calc-btn">6</button>
    <button (click)="onKeyPress('-')" class="calc-btn-op">-</button>
    
    <button (click)="onKeyPress('1')" class="calc-btn">1</button>
    <button (click)="onKeyPress('2')" class="calc-btn">2</button>
    <button (click)="onKeyPress('3')" class="calc-btn">3</button>
    <button (click)="onKeyPress('+')" class="calc-btn-op">+</button>
    
    <button (click)="onKeyPress('0')" class="calc-btn col-span-2">0</button>
    <button (click)="onKeyPress('.')" class="calc-btn">.</button>
    <button (click)="onKeyPress('=')" class="calc-btn-op">=</button>
  </div>
</div>`;
const CALCULATOR_COMPONENT_CSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .calc-btn {
    @apply bg-gray-600 hover:bg-gray-500 text-white text-2xl rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400;
  }
  .calc-btn-op {
    @apply accent-bg text-white text-2xl rounded-lg transition-colors focus:outline-none focus:ring-2 accent-ring-focus;
  }
}`;

// --- WEATHER APP ---
const WEATHER_COMPONENT_TS = `import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { WeatherService } from '../../../services/weather.service';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class WeatherComponent implements OnInit {
  private weatherService = inject(WeatherService);

  weather = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.getWeatherForCity('New York');
  }

  getWeatherForCity(city: string) {
    if (!city) return;
    this.loading.set(true);
    this.error.set(null);
    this.weatherService.getWeatherByCity(city).subscribe({
      next: data => {
        this.weather.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not fetch weather for that city.');
        this.loading.set(false);
      }
    });
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      this.loading.set(true);
      this.error.set(null);
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        this.weatherService.getWeatherByCoords(latitude, longitude).subscribe({
          next: data => {
            this.weather.set(data);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Could not fetch weather for your location.');
            this.loading.set(false);
          }
        });
      }, () => {
        this.error.set('Geolocation access denied.');
        this.loading.set(false);
      });
    } else {
      this.error.set('Geolocation is not supported by your browser.');
    }
  }

  onSearch(event: Event) {
    const city = (event.target as HTMLInputElement).value;
    this.getWeatherForCity(city);
  }
}`;
const WEATHER_COMPONENT_HTML = `
<div class="h-full bg-cover bg-center p-6 flex flex-col text-white relative" 
     [style.background-image]="weather() ? 'url(https://source.unsplash.com/600x400/?' + weather().weather[0].main + ')' : 'url(https://source.unsplash.com/600x400/?weather)'">
  <div class="absolute inset-0 bg-black/50"></div>
  
  <div class="relative z-10 flex-shrink-0 mb-4 flex gap-2">
    <input type="text" placeholder="Search city..." (change)="onSearch($event)" 
           class="flex-1 bg-white/20 backdrop-blur-md rounded-lg p-2 focus:outline-none focus:ring-2 accent-ring-focus">
    <button (click)="useCurrentLocation()" class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors">
      <i class="fas fa-location-arrow"></i>
    </button>
  </div>

  <div class="relative z-10 flex-1 flex items-center justify-center">
    @if (loading()) {
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-4xl"></i>
        <p>Loading Weather...</p>
      </div>
    } @else if (error()) {
      <div class="text-center bg-red-500/50 p-4 rounded-lg">
        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
        <p>{{ error() }}</p>
      </div>
    } @else if (weather()) {
      <div class="text-center">
        <h1 class="text-4xl md:text-6xl font-bold">{{ weather().name }}</h1>
        <p class="text-xl md:text-2xl capitalize">{{ weather().weather[0].description }}</p>
        <div class="flex items-center justify-center my-4">
          <img [src]="'https://openweathermap.org/img/wn/' + weather().weather[0].icon + '@2x.png'" alt="weather icon" class="w-20 h-20">
          <p class="text-6xl md:text-8xl font-thin">{{ weather().main.temp | number:'1.0-0' }}°C</p>
        </div>
        <div class="flex justify-center gap-4 md:gap-8 text-lg">
          <p>Feels like: {{ weather().main.feels_like | number:'1.0-0' }}°</p>
          <p>Humidity: {{ weather().main.humidity }}%</p>
        </div>
      </div>
    }
  </div>
</div>`;

// --- TERMINAL APP ---
const TERMINAL_COMPONENT_TS = `import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs/interop';
import { CommonModule } from '@angular/common';
import { GoogleGenerativeAI } from '@google/genai';
import { NotificationService } from '../../../services/notification.service';
import { OsInteractionService } from '../../../services/os-interaction.service';

interface TerminalLine {
  type: 'command' | 'response';
  text: string;
  isThinking?: boolean;
}

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TerminalComponent {
  lines = signal<TerminalLine[]>([
    { type: 'response', text: "Welcome to Banana OS Terminal. Type 'help' for commands." }
  ]);
  
  @ViewChild('input') inputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('output') outputEl!: ElementRef<HTMLDivElement>;

  private notificationService = inject(NotificationService);
  private osInteraction = inject(OsInteractionService);
  private destroyRef = inject(DestroyRef);
  private ai: GoogleGenerativeAI | null = null;
  
  constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenerativeAI(process.env.API_KEY);
    } else {
       console.error('API key is not configured for Terminal AI.');
    }

    this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'terminal' && action.action === 'executeTerminalCommand') {
          this.runCommand(action.payload.command);
        }
      });
  }

  async processCommand(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    if (!input) return;

    this.runCommand(input);
    (event.target as HTMLInputElement).value = '';
  }
  
  async runCommand(command: string) {
    this.lines.update(current => [...current, { type: 'command', text: command }]);

    const [cmd] = command.trim().toLowerCase().split(' ');
    if (cmd === 'ai') {
        this.lines.update(current => [...current, { type: 'response', text: 'Thinking...', isThinking: true }]);
        this.scrollToBottom();
    }

    const response = await this.getCommandResponse(command.trim());
    
    this.lines.update(current => {
        const newLines = [...current];
        const lastLine = newLines[newLines.length - 1];

        if (lastLine?.isThinking) {
            if (response) {
                lastLine.text = response;
                delete lastLine.isThinking;
            } else {
                newLines.pop(); // Remove thinking line if no response
            }
        } else if (response) {
            newLines.push({ type: 'response', text: response });
        }
        return newLines;
    });

    this.scrollToBottom();
  }

  private scrollToBottom() {
      setTimeout(() => {
        if (this.outputEl) {
            this.outputEl.nativeElement.scrollTop = this.outputEl.nativeElement.scrollHeight;
        }
    });
  }

  private async getCommandResponse(command: string): Promise<string | null> {
    const [cmd, ...args] = command.split(' ');
    switch (cmd.toLowerCase()) {
      case 'help':
        return "Available: help, clear, date, echo, neofetch, ai";
      case 'clear':
        this.lines.set([]);
        return null;
      case 'date':
        return new Date().toString();
      case 'echo':
        return args.join(' ');
      case 'neofetch':
        return \`
🍌 Banana OS v1.0
-----------------
OS: Banana OS (Angular)
Kernel: Web Browser
Resolution: \${window.innerWidth}x\${window.innerHeight}
Theme: Dark
        \`.trim();
      case 'ai':
        if (!this.ai) {
          this.notificationService.show({ appId: 'terminal', title: 'Terminal', body: 'AI is not configured. API key is missing.', type: 'error' });
          return 'Error: AI functionality is not available. API key is missing.';
        }
        try {
          const prompt = args.join(' ');
          if (!prompt) return 'Please provide a prompt for the AI. Usage: ai "your question"';
          
          const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        } catch (e) {
          console.error(e);
          this.notificationService.show({ appId: 'terminal', title: 'Terminal', body: 'Could not get response from AI.', type: 'error' });
          return 'Error: Could not get a response from the AI.';
        }
      default:
        return \`Command not found: \${cmd}\`;
    }
  }

  focusInput() {
    this.inputEl?.nativeElement.focus();
  }
}`;
const TERMINAL_COMPONENT_HTML = `
<div class="h-full bg-black text-white font-mono text-sm p-2 flex flex-col" (click)="focusInput()">
  <div #output class="flex-grow overflow-y-auto">
    @for (line of lines(); track $index) {
      <div>
        @if (line.type === 'command') {
          <span class="text-yellow-400">user@banana:~$</span>
          <span class="ml-2">{{ line.text }}</span>
        } @else {
          @if (line.isThinking) {
            <span class="text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>{{ line.text }}</span>
          } @else {
            <span class="text-green-400 whitespace-pre-wrap">{{ line.text }}</span>
          }
        }
      </div>
    }
  </div>
  <div class="flex-shrink-0 flex items-center">
    <span class="text-yellow-400">user@banana:~$</span>
    <input #input type="text" (change)="processCommand($event)" class="bg-transparent border-none text-green-400 flex-1 ml-2 focus:outline-none" autofocus>
  </div>
</div>`;

// --- NOTES APP ---
const NOTES_COMPONENT_TS = `import { ChangeDetectionStrategy, Component, effect, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs/interop';
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
          const firstLine = content.trim().split('\\n')[0];
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
}`;
const NOTES_COMPONENT_HTML = `<div class="h-full flex bg-gray-800 text-gray-200">
  <!-- Sidebar with notes list -->
  <div class="w-64 bg-gray-900/50 flex-shrink-0 flex flex-col">
    <div class="p-2 flex-shrink-0 border-b border-gray-700/50 flex items-center justify-between">
      <h2 class="text-lg font-bold">Notes</h2>
      <button (click)="createNewNote()" class="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-md" title="New Note">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <div class="flex-1 overflow-y-auto">
      @for (note of notes(); track note.id) {
        <div (click)="selectNote(note)" 
             class="p-3 cursor-pointer border-l-4"
             [class.bg-gray-700/50]="selectedNoteId() === note.id"
             [class.accent-border]="selectedNoteId() === note.id"
             [class.border-transparent]="selectedNoteId() !== note.id"
             [class.hover:bg-gray-700/30]="selectedNoteId() !== note.id">
          <h3 class="font-semibold truncate">{{ note.title }}</h3>
          <p class="text-xs text-gray-400">{{ note.lastModified | date:'short' }}</p>
        </div>
      }
    </div>
  </div>

  <!-- Main Content - Editor -->
  <div class="flex-1 flex flex-col">
    @if (selectedNoteId() !== null) {
      <div class="p-2 flex-shrink-0 border-b border-gray-700/50 flex items-center justify-end">
        <button (click)="deleteSelectedNote()" class="w-8 h-8 flex items-center justify-center hover:bg-red-500/50 rounded-md text-red-400 hover:text-red-300" title="Delete Note">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <textarea class="flex-1 bg-gray-800 text-gray-200 p-4 font-sans text-base focus:outline-none resize-none"
                placeholder="Start writing your note..."
                [ngModel]="selectedNoteContent()"
                (ngModelChange)="selectedNoteContent.set($event)"></textarea>
    } @else {
      <div class="h-full flex items-center justify-center text-gray-500">
        <div class="text-center">
          <i class="fas fa-sticky-note text-5xl mb-4"></i>
          <p>Select a note or create a new one.</p>
        </div>
      </div>
    }
  </div>
</div>`;

const initialFileSystem: FileSystemDirectory = {
  name: '',
  path: '/',
  type: 'directory',
  children: {
    'Desktop': { name: 'Desktop', path: '/Desktop', type: 'directory', children: {} },
    'Documents': {
      name: 'Documents', path: '/Documents', type: 'directory',
      children: {
        'welcome.txt': {
          name: 'welcome.txt', path: '/Documents/welcome.txt', type: 'file',
          content: 'Welcome to the Banana OS Text Editor!'
        },
        'photo.png': {
          name: 'photo.png', path: '/Documents/photo.png', type: 'file',
          content: defaultImageBase64,
        }
      }
    },
    'Downloads': { name: 'Downloads', path: '/Downloads', type: 'directory', children: {} },
    'System': {
      name: 'System', path: '/System', type: 'directory',
      children: {
        'kernel.bin': { name: 'kernel.bin', path: '/System/kernel.bin', type: 'file', content: 'BINARY_DATA' },
        'config.sys': { name: 'config.sys', path: '/System/config.sys', type: 'file', content: 'CONFIG_DATA' }
      }
    },
    'src': {
      name: 'src',
      path: '/src',
      type: 'directory',
      children: {
        'app.component.ts': { name: 'app.component.ts', path: '/src/app.component.ts', type: 'file', content: APP_COMPONENT_TS },
        'app.component.html': { name: 'app.component.html', path: '/src/app.component.html', type: 'file', content: APP_COMPONENT_HTML },
        'components': {
          name: 'components',
          path: '/src/components',
          type: 'directory',
          children: {
            'window': {
                name: 'window',
                path: '/src/components/window',
                type: 'directory',
                children: {
                    'window.component.ts': { name: 'window.component.ts', path: '/src/components/window/window.component.ts', type: 'file', content: WINDOW_COMPONENT_TS },
                    'window.component.html': { name: 'window.component.html', path: '/src/components/window/window.component.html', type: 'file', content: WINDOW_COMPONENT_HTML },
                }
            },
            'apps': {
              name: 'apps',
              path: '/src/components/apps',
              type: 'directory',
              children: {
                'browser': {
                  name: 'browser',
                  path: '/src/components/apps/browser',
                  type: 'directory',
                  children: {
                    'browser.component.ts': {
                      name: 'browser.component.ts',
                      path: '/src/components/apps/browser/browser.component.ts',
                      type: 'file',
                      content: BROWSER_COMPONENT_TS,
                    },
                    'browser.component.html': {
                      name: 'browser.component.html',
                      path: '/src/components/apps/browser/browser.component.html',
                      type: 'file',
                      content: BROWSER_COMPONENT_HTML,
                    }
                  }
                },
                'calculator': {
                    name: 'calculator',
                    path: '/src/components/apps/calculator',
                    type: 'directory',
                    children: {
                        'calculator.component.ts': { name: 'calculator.component.ts', path: '/src/components/apps/calculator/calculator.component.ts', type: 'file', content: CALCULATOR_COMPONENT_TS },
                        'calculator.component.html': { name: 'calculator.component.html', path: '/src/components/apps/calculator/calculator.component.html', type: 'file', content: CALCULATOR_COMPONENT_HTML },
                        'calculator.component.css': { name: 'calculator.component.css', path: '/src/components/apps/calculator/calculator.component.css', type: 'file', content: CALCULATOR_COMPONENT_CSS },
                    }
                },
                'weather': {
                    name: 'weather',
                    path: '/src/components/apps/weather',
                    type: 'directory',
                    children: {
                        'weather.component.ts': { name: 'weather.component.ts', path: '/src/components/apps/weather/weather.component.ts', type: 'file', content: WEATHER_COMPONENT_TS },
                        'weather.component.html': { name: 'weather.component.html', path: '/src/components/apps/weather/weather.component.html', type: 'file', content: WEATHER_COMPONENT_HTML },
                    }
                },
                'terminal': {
                    name: 'terminal',
                    path: '/src/components/apps/terminal',
                    type: 'directory',
                    children: {
                        'terminal.component.ts': { name: 'terminal.component.ts', path: '/src/components/apps/terminal/terminal.component.ts', type: 'file', content: TERMINAL_COMPONENT_TS },
                        'terminal.component.html': { name: 'terminal.component.html', path: '/src/components/apps/terminal/terminal.component.html', type: 'file', content: TERMINAL_COMPONENT_HTML },
                    }
                },
                'notes': {
                    name: 'notes',
                    path: '/src/components/apps/notes',
                    type: 'directory',
                    children: {
                        'notes.component.ts': { name: 'notes.component.ts', path: '/src/components/apps/notes/notes.component.ts', type: 'file', content: NOTES_COMPONENT_TS },
                        'notes.component.html': { name: 'notes.component.html', path: '/src/components/apps/notes/notes.component.html', type: 'file', content: NOTES_COMPONENT_HTML },
                    }
                }
              }
            }
          }
        },
        'services': {
            name: 'services',
            path: '/src/services',
            type: 'directory',
            children: {
                'os-interaction.service.ts': { name: 'os-interaction.service.ts', path: '/src/services/os-interaction.service.ts', type: 'file', content: OS_INTERACTION_SERVICE_TS },
                'app-management.service.ts': { name: 'app-management.service.ts', path: '/src/services/app-management.service.ts', type: 'file', content: APP_MANAGEMENT_SERVICE_TS },
                'settings.service.ts': { name: 'settings.service.ts', path: '/src/services/settings.service.ts', type: 'file', content: SETTINGS_SERVICE_TS },
            }
        }
      }
    }
  }
};

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  private fileSystem = signal<FileSystemDirectory>(this.loadFromLocalStorage());

  constructor() {
    effect(() => {
      localStorage.setItem(FS_LOCAL_STORAGE_KEY, JSON.stringify(this.fileSystem()));
    });
  }

  private loadFromLocalStorage(): FileSystemDirectory {
    try {
      const savedFS = localStorage.getItem(FS_LOCAL_STORAGE_KEY);
      return savedFS ? JSON.parse(savedFS) : initialFileSystem;
    } catch {
      return initialFileSystem;
    }
  }
  
  private updateNodeByPath<T extends FileSystemNode>(path: string, updateFn: (node: T) => void): boolean {
      const parts = path.split('/').filter(p => p);
      if (parts.length === 0 && path !== '/') { // Cannot update root this way, but allow root update for specific cases
          return false;
      }

      this.fileSystem.update(fs => {
          const newFs = JSON.parse(JSON.stringify(fs));
          let currentNode: FileSystemDirectory = newFs;
          
          if (path === '/') {
              updateFn(currentNode as T);
              return newFs;
          }

          for (let i = 0; i < parts.length - 1; i++) {
              currentNode = currentNode.children[parts[i]] as FileSystemDirectory;
          }
          const targetNode = currentNode.children[parts[parts.length - 1]];
          if (targetNode) {
              updateFn(targetNode as T);
          }
          return newFs;
      });
      return true;
  }


  private getNode(path: string): FileSystemNode | null {
    if (path === '/') return this.fileSystem();
    const parts = path.split('/').filter(p => p);
    let currentNode: FileSystemNode = this.fileSystem();
    for (const part of parts) {
      if (currentNode.type === 'directory') {
        // Fix: Removed redundant cast. Type narrowing handles this due to the discriminated union.
        const child = currentNode.children[part];
        if (child) {
          currentNode = child;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    return currentNode;
  }

  getDirectory(path: string): FileSystemDirectory | null {
    const node = this.getNode(path);
    // Fix: Removed redundant cast. Type narrowing handles this due to the discriminated union.
    return node?.type === 'directory' ? node : null;
  }

  readFile(path: string): string | null {
    const node = this.getNode(path);
    // Fix: Removed redundant cast. Type narrowing handles this due to the discriminated union.
    return node?.type === 'file' ? node.content : null;
  }

  writeFile(path: string, content: string): boolean {
    return this.updateNodeByPath<FileSystemFile>(path, (file) => {
        file.content = content;
    });
  }
  
  createDirectory(parentPath: string, dirName: string): boolean {
    const parentDir = this.getDirectory(parentPath);
    if (!parentDir || parentDir.children[dirName]) {
      return false;
    }

    let success = false;
    this.fileSystem.update(fs => {
        const newFs = JSON.parse(JSON.stringify(fs));

        let targetParentDir: FileSystemDirectory | null = newFs;
        if (parentPath !== '/') {
            const parts = parentPath.split('/').filter(p => p);
            for (const part of parts) {
                if (!targetParentDir) {
                    targetParentDir = null;
                    break;
                }
                const next = targetParentDir.children[part];
                if (next && next.type === 'directory') {
                    targetParentDir = next;
                } else {
                    targetParentDir = null;
                    break;
                }
            }
        }

        if (targetParentDir) {
            targetParentDir.children[dirName] = {
                name: dirName,
                path: `${parentPath === '/' ? '' : parentPath}/${dirName}`,
                type: 'directory',
                children: {}
            };
            success = true;
            return newFs;
        }
        
        return fs;
    });

    return success;
  }
  
  createFile(parentPath: string, fileName: string, content: string = ''): boolean {
    const parentDir = this.getDirectory(parentPath);
    if (!parentDir || parentDir.children[fileName]) {
        return false;
    }

    let success = false;
    this.fileSystem.update(fs => {
        const newFs = JSON.parse(JSON.stringify(fs));

        let targetParentDir: FileSystemDirectory | null = newFs;
        if (parentPath !== '/') {
            const parts = parentPath.split('/').filter(p => p);
            for (const part of parts) {
                if (!targetParentDir) {
                    targetParentDir = null;
                    break;
                }
                const next = targetParentDir.children[part];
                if (next && next.type === 'directory') {
                    targetParentDir = next;
                } else {
                    targetParentDir = null;
                    break;
                }
            }
        }

        if (targetParentDir) {
            targetParentDir.children[fileName] = {
                name: fileName,
                path: `${parentPath === '/' ? '' : parentPath}/${fileName}`,
                type: 'file',
                content: content
            };
            success = true;
            return newFs;
        }

        return fs;
    });

    return success;
  }
  
  deleteNode(path: string): boolean {
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const nodeName = path.substring(path.lastIndexOf('/') + 1);
      
      const parentDir = this.getDirectory(parentPath);
      if (!parentDir || !parentDir.children[nodeName]) return false;

      this.updateNodeByPath<FileSystemDirectory>(parentPath, (dir) => {
          delete dir.children[nodeName];
      });
      return true;
  }
  
  renameNode(path: string, newName: string): boolean {
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const oldName = path.substring(path.lastIndexOf('/') + 1);

    const parentDir = this.getDirectory(parentPath);
    if (!parentDir || !parentDir.children[oldName] || parentDir.children[newName]) {
        return false;
    }

    this.updateNodeByPath<FileSystemDirectory>(parentPath, (dir) => {
        const nodeToRename = dir.children[oldName];
        nodeToRename.name = newName;
        nodeToRename.path = `${parentPath === '/' ? '' : parentPath}/${newName}`;

        // If it's a directory, recursively update children paths
        if (nodeToRename.type === 'directory') {
            this.updateChildrenPaths(nodeToRename, nodeToRename.path);
        }
        
        dir.children[newName] = nodeToRename;
        delete dir.children[oldName];
    });
    return true;
  }

  private updateChildrenPaths(dir: FileSystemDirectory, parentPath: string) {
      for (const childName in dir.children) {
          const child = dir.children[childName];
          child.path = `${parentPath}/${child.name}`;
          if (child.type === 'directory') {
              this.updateChildrenPaths(child, child.path);
          }
      }
  }
}