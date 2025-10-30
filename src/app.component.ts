import { Component, ChangeDetectionStrategy, signal, effect, inject, Renderer2, PLATFORM_ID, OnDestroy, computed, Injector, OnInit, Type } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { WindowComponent } from './components/window/window.component';
import { AppWindow } from './models/window.model';
import { SettingsService } from './services/settings.service';
import { AppManagementService } from './services/app-management.service';
import { OsInteractionService } from './services/os-interaction.service';
import { WINDOW_CONTEXT } from './injection-tokens';
import { DesktopStateService } from './services/desktop-state.service';
import { NotificationService } from './services/notification.service';
import { AppRegistryService } from './services/app-registry.service';
import { FileSystemNode, FileSystemService } from './services/file-system.service';
import { SystemPreferencesService } from './services/system-preferences.service';
import { LockScreenService } from './services/lock-screen.service';

// Import all app components for registration
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
import { PaintComponent } from './components/apps/paint/paint.component';
import { KanbanComponent } from './components/apps/kanban/kanban.component';
import { FitnessTrackerComponent } from './components/apps/fitness-tracker/fitness-tracker.component';
import { EbookReaderComponent } from './components/apps/ebook-reader/ebook-reader.component';
import { AppBuilderComponent } from './components/apps/app-builder/app-builder.component';
import { CustomAppRunnerComponent } from './components/apps/custom-app-runner/custom-app-runner.component';
import { APPS_CONFIG } from './config/apps.config';

// Types for persisting window state in localStorage
type SerializableAppWindow = Omit<AppWindow, 'component' | 'injector'>;
interface WindowsState {
  windows: (SerializableAppWindow & { contextData?: any })[];
  activeWindowId: string | null;
  nextZIndex: number;
}
const WINDOWS_STATE_KEY = 'banana-os-windows-state';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, WindowComponent
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
  private appRegistry = inject(AppRegistryService);
  private fileSystemService = inject(FileSystemService);
  systemPreferences = inject(SystemPreferencesService);
  private lockScreenService = inject(LockScreenService);
  
  windows = signal<AppWindow[]>([]);
  activeWindowId = signal<string | null>(null);
  nextZIndex = signal(10);
  isStartMenuOpen = signal(false);
  
  restartingMessage = signal<string | null>(null);
  isRestarting = computed(() => this.restartingMessage() !== null);

  isFactoryResetConfirmOpen = signal(false);
  isNotificationCenterOpen = signal(false);

  currentTime = signal(new Date());
  private clockInterval: any;

  // Lock screen state
  isLocked = this.lockScreenService.isLocked;
  unlockAttemptPassword = signal('');
  unlockError = signal(false);

  timeFormatString = computed(() => {
    return this.systemPreferences.timeFormat() === '12h' ? 'h:mm:ss a' : 'HH:mm:ss';
  });

  private allApps = this.appManagementService.allApps;
  installedApps = computed(() => 
    this.allApps().filter(app => this.appManagementService.isAppInstalled(app.id))
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

  desktopFiles = signal<FileSystemNode[]>([]);
  isSystemCorrupted = this.fileSystemService.isCorrupted;

  constructor() {
    this.registerOriginalApps();

    if (isPlatformBrowser(this.platformId)) {
        effect(() => {
            // This effect runs once on startup and whenever a custom app is installed/uninstalled.
            // It ensures that the app registry is aware of all user-created apps.
            this.appManagementService.customApps().forEach(app => {
                this.appRegistry.register(app.id, CustomAppRunnerComponent);
            });
        });

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
          localStorage.removeItem(WINDOWS_STATE_KEY); 
          this.runRestartSequence();
        });

        this.osInteraction.copilotActionRequest.subscribe(action => {
          this.handleCopilotAction(action);
        });

        // This effect runs whenever window state changes and saves it.
        effect(() => {
            if (this.isRestarting()) return;
            const state: WindowsState = {
                windows: this.windows().map(w => {
                    const { component, injector, ...serializableWindow } = w;
                    const contextData = injector?.get(WINDOW_CONTEXT, null);
                    return { ...serializableWindow, contextData };
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
          const desktopDir = this.fileSystemService.getDirectory('/Desktop');
          if (desktopDir) {
            this.desktopFiles.set(Object.values(desktopDir.children));
          }
        });

        effect(() => {
            const wallpaperValue = this.settingsService.wallpaper();
            this.document.body.classList.forEach(className => {
                if (className.startsWith('wallpaper-')) this.renderer.removeClass(this.document.body, className);
            });
            this.renderer.setStyle(this.document.body, 'background-image', '');

            if (wallpaperValue.startsWith('data:image')) {
                this.renderer.setStyle(this.document.body, 'background-image', `url(${wallpaperValue})`);
                this.renderer.setStyle(this.document.body, 'background-size', 'cover');
                this.renderer.setStyle(this.document.body, 'background-position', 'center');
            } else {
                this.renderer.addClass(this.document.body, wallpaperValue);
            }
        });
        
        effect(() => {
            const color = this.settingsService.accentColor();
            this.document.documentElement.style.setProperty('--accent-color', `var(--accent-color-${color})`);
        });

        effect(() => {
            const mode = this.systemPreferences.powerMode();
            this.renderer.removeClass(this.document.body, 'power-mode-performance');
            this.renderer.removeClass(this.document.body, 'power-mode-saving');
            if (mode === 'performance') {
                this.renderer.addClass(this.document.body, 'power-mode-performance');
            } else if (mode === 'power-saving') {
                this.renderer.addClass(this.document.body, 'power-mode-saving');
            }
        });
    }
  }

  private async runRestartSequence() {
    this.restartingMessage.set('Applying changes...');
    await new Promise(res => setTimeout(res, 700));
    
    this.restartingMessage.set('Finalizing...');
    await new Promise(res => setTimeout(res, 800));

    this.restartingMessage.set('Restarting now...');
    await new Promise(res => setTimeout(res, 500));
    
    window.location.reload();
  }

  private registerOriginalApps() {
    this.appRegistry.register('banana-copilot', CopilotComponent);
    this.appRegistry.register('file-explorer', FileExplorerComponent);
    this.appRegistry.register('terminal', TerminalComponent);
    this.appRegistry.register('settings', SettingsComponent);
    this.appRegistry.register('store', StoreComponent);
    this.appRegistry.register('photo-viewer', PhotoViewerComponent);
    this.appRegistry.register('camera', CameraComponent);
    this.appRegistry.register('creative-music', MusicPlayerComponent);
    this.appRegistry.register('creative-markdown', MarkdownEditorComponent);
    this.appRegistry.register('creative-podcast', PodcastsComponent);
    this.appRegistry.register('browser', BrowserComponent);
    this.appRegistry.register('text-editor', TextEditorComponent);
    this.appRegistry.register('prod-notes', NotesComponent);
    this.appRegistry.register('prod-calendar', CalendarComponent);
    this.appRegistry.register('prod-clock', ClockComponent);
    this.appRegistry.register('prod-maps', MapsComponent);
    this.appRegistry.register('calculator', CalculatorComponent);
    this.appRegistry.register('weather', WeatherComponent);
    this.appRegistry.register('util-system-monitor', SystemMonitorComponent);
    this.appRegistry.register('util-pdf-reader', PdfReaderComponent);
    this.appRegistry.register('app-translator', TranslatorComponent);
    this.appRegistry.register('game-chess', ChessComponent);
    this.appRegistry.register('game-solitaire', SolitaireComponent);
    this.appRegistry.register('game-minesweeper', MinesweeperComponent);
    this.appRegistry.register('game-sudoku', SudokuComponent);
    this.appRegistry.register('game-puzzle-blocks', PuzzleBlocksComponent);
    this.appRegistry.register('game-2048', Game2048Component);
    this.appRegistry.register('game-word-finder', WordFinderComponent);
    this.appRegistry.register('app-recipes', RecipeBookComponent);
    this.appRegistry.register('app-stocks', StocksComponent);
    this.appRegistry.register('app-news', NewsFeedComponent);
    this.appRegistry.register('social-forums', ForumsComponent);
    this.appRegistry.register('other-ide', BananaIdeComponent);
    this.appRegistry.register('paint', PaintComponent);
    this.appRegistry.register('kanban', KanbanComponent);
    this.appRegistry.register('fitness-tracker', FitnessTrackerComponent);
    this.appRegistry.register('ebook-reader', EbookReaderComponent);
    this.appRegistry.register('app-builder', AppBuilderComponent);

    // Register placeholder for all other apps
    APPS_CONFIG.forEach(app => {
        if (!this.appRegistry.get(app.id)) {
            this.appRegistry.register(app.id, PlaceholderAppComponent);
        }
    });
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
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  private handleCopilotAction(action: { action: string, [key: string]: any }) {
    switch(action.action) {
      case 'openApp': this.openApp(action.appId); break;
      case 'setWallpaper': this.settingsService.setWallpaper(action.wallpaperId); break;
      case 'setAccentColor': this.settingsService.setAccentColor(action.color); break;
      case 'restart': this.osInteraction.restartRequest.next(); break;
      case 'factoryReset': this.requestFactoryReset(); break;
      case 'corruptFileSystem': 
        this.notificationService.show({ appId: 'banana-copilot', title: 'System Corruption', body: 'File system corruption initiated by Copilot.', type: 'error' });
        this.fileSystemService.corruptFileSystem();
        break;
    }
  }

  private performFactoryReset() {
    this.windows.set([]);
    this.appManagementService.uninstallAllNonCoreApps();
    this.settingsService.resetToDefaults();
    this.systemPreferences.resetAllToDefaults();
    this.fileSystemService.resetToDefaults();
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
// Fix: Explicitly type the return value of the map function to AppWindow | null.
// This ensures that the type predicate in the following filter function is valid,
// resolving a type mismatch error where the inferred object type from the map
// was not assignable to the AppWindow type expected by the predicate.
              const reconstructedWindows: AppWindow[] = savedState.windows
                .map((sw): AppWindow | null => {
                  const appConfig = this.allApps().find(app => app.id === sw.appId);
                  const component = this.appRegistry.get(sw.appId);
                  if (!appConfig || !component) return null;
                  
                  let customInjector: Injector | undefined;
                  if (sw.contextData) { 
                       customInjector = Injector.create({ providers: [{ provide: WINDOW_CONTEXT, useValue: sw.contextData }], parent: this.injector });
                  }
                  
                  const { contextData, ...serializableWindow } = sw;

                  return { ...serializableWindow, component, injector: customInjector };
                })
                .filter((w): w is AppWindow => w !== null);

              this.windows.set(reconstructedWindows);
              this.activeWindowId.set(savedState.activeWindowId);
              this.nextZIndex.set(savedState.nextZIndex || 10);
          } catch (e) {
              console.error("Failed to load window state:", e);
              localStorage.removeItem(WINDOWS_STATE_KEY);
          }
      }
  }

  ngOnDestroy() {
      if (this.clockInterval) clearInterval(this.clockInterval);
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
    
    const appConfig = this.allApps().find(app => app.id === appId);
    const component = this.appRegistry.get(appId);
    if (!appConfig || !component) {
        console.error(`App or component not found for id: ${appId}`);
        return;
    }

    const newWindowId = `win-${Date.now()}`;
    const newZIndex = this.nextZIndex();
    const defaultSize = appConfig.defaultSize || { width: 600, height: 400 };

    let finalSize = { ...defaultSize };
    let finalPosition = { x: 50 + (this.windows().length % 10) * 20, y: 50 + (this.windows().length % 10) * 20 };

    if (isPlatformBrowser(this.platformId)) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        if (screenWidth < 768) {
            finalSize.width = Math.min(defaultSize.width, screenWidth * 0.95);
            finalSize.height = Math.min(defaultSize.height, screenHeight * 0.8);
            
            finalPosition.x = (screenWidth - finalSize.width) / 2;
            finalPosition.y = (screenHeight - finalSize.height - 52) / 4;
        } else {
            finalSize.width = Math.min(defaultSize.width, screenWidth - 40);
            finalSize.height = Math.min(defaultSize.height, screenHeight - 52 - 40);

            if (finalPosition.x + finalSize.width > screenWidth) {
                finalPosition.x = screenWidth - finalSize.width - 20;
            }
            if (finalPosition.y + finalSize.height > screenHeight - 52) {
                finalPosition.y = screenHeight - finalSize.height - 52 - 20;
            }
             if (finalPosition.x < 0) finalPosition.x = 20;
             if (finalPosition.y < 0) finalPosition.y = 20;
        }
    }

    let customInjector: Injector | undefined;
    const contextData = { ...data, windowId: newWindowId, appId: appId };
    customInjector = Injector.create({ providers: [{ provide: WINDOW_CONTEXT, useValue: contextData }], parent: this.injector });

    const newWindow: AppWindow = {
      id: newWindowId,
      appId: appConfig.id,
      title: appConfig.title,
      icon: appConfig.icon,
      component: component,
      position: finalPosition,
      size: finalSize,
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

  async attemptUnlock() {
    this.unlockError.set(false);
    const success = await this.lockScreenService.unlock(this.unlockAttemptPassword());
    if (!success) {
      this.unlockError.set(true);
      // Reset after animation
      setTimeout(() => this.unlockError.set(false), 820);
    }
    this.unlockAttemptPassword.set('');
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

  openDesktopFile(node: FileSystemNode) {
    if (node.type === 'directory') {
      this.openApp('file-explorer', { path: node.path });
      return;
    }
    
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
      this.openApp(appId, { filePath: node.path });
    } else {
      this.notificationService.show({ appId: 'file-explorer', title: 'Desktop', body: `File type ".${extension}" is not supported.`, type: 'warning' });
    }
  }

  emergencyFix() {
    this.fileSystemService.resetToDefaults();
    this.notificationService.show({ appId: 'settings', title: 'System Restore', body: 'Emergency fix applied. File system has been restored to default.', type: 'success' });
  }
}