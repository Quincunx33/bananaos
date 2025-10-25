import { Component, ChangeDetectionStrategy, signal, effect, inject, Renderer2, PLATFORM_ID, OnDestroy, computed, Injector, OnInit } from '@angular/core';
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
import { BackupService } from './services/backup.service';

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
  backupService = inject(BackupService);
  
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
  isRestoreConfirmOpen = signal(false);
  
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
    
    const originalContent = this.fsService.readFile(payload.filePath);
    this.backupService.createBackup(payload.filePath, originalContent);

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
        body: `Could not write changes to ${payload.filePath}.`,
        type: 'error'
      });
    }
    this.cancelCodeRepair();
  }

  cancelCodeRepair() {
    this.isCodeRepairConfirmOpen.set(false);
    this.codeRepairPayload.set(null);
  }

  requestEmergencyRestore() { this.isRestoreConfirmOpen.set(true); }
  cancelEmergencyRestore() { this.isRestoreConfirmOpen.set(false); }

  confirmEmergencyRestore() {
      const backup = this.backupService.restoreLastBackup();
      if (backup) {
          const success = this.fsService.writeFile(backup.filePath, backup.content);
          if (success) {
              this.notificationService.show({
                  appId: 'banana-copilot',
                  title: 'System Restore',
                  body: `Restored ${backup.filePath}. Restarting system.`,
                  type: 'success'
              });
              this.backupService.clearBackup();
              this.osInteraction.restartRequest.next();
          } else {
               this.notificationService.show({
                  appId: 'banana-copilot',
                  title: 'Restore Failed',
                  body: `Could not write restored content to ${backup.filePath}.`,
                  type: 'error'
              });
          }
      } else {
          this.notificationService.show({
              appId: 'banana-copilot',
              title: 'Restore Failed',
              body: `No backup found to restore.`,
              type: 'error'
          });
      }
      this.isRestoreConfirmOpen.set(false);
  }

  private performFactoryReset() {
    this.windows.set([]);
    this.appManagementService.uninstallAllNonCoreApps();
    this.settingsService.resetToDefaults();
    this.activeWindowId.set(null);
    this.nextZIndex.set(10);
    this.backupService.clearBackup();
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

    const newWindowId = `win-${Date.now()}`;
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
}