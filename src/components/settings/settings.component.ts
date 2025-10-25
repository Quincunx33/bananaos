import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { CommonModule } from '@angular/common';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { IpService } from '../../../services/ip.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class SettingsComponent implements OnInit {
  // Fix: Explicitly type injected services to prevent them from being treated as 'unknown'.
  settingsService: SettingsService = inject(SettingsService);
  osInteraction: OsInteractionService = inject(OsInteractionService);
  private ipService: IpService = inject(IpService);
  activeTab = signal('system');

  wallpapers = [
    { id: 'wallpaper-default', name: 'Default' },
    { id: 'wallpaper-aurora', name: 'Aurora' },
    { id: 'wallpaper-sunset', name: 'Sunset' },
    { id: 'wallpaper-galaxy', name: 'Galaxy' }
  ];

  accentColors = [ 'blue', 'green', 'red', 'purple', 'yellow', 'pink' ];

  // Data management
  exportPassword = signal('');
  importPassword = signal('');
  importFile = signal<File | null>(null);
  notification = signal<{ type: 'success' | 'error', message: string } | null>(null);

  // Custom Wallpaper
  customWallpaperPreview = signal<string | null>(null);

  // System Info
  ipAddress = signal('Loading...');
  macAddress = signal('N/A');
  deviceModel = signal('N/A');
  year = new Date().getFullYear();

  // System Reset
  isFactoryResetConfirmOpen = signal(false);
  isRestartConfirmOpen = signal(false);

  ngOnInit() {
    this.ipService.getPublicIp().subscribe({
      next: ip => this.ipAddress.set(ip),
      error: () => this.ipAddress.set('Unavailable')
    });
    this.macAddress.set(this.generateMacAddress());
    this.deviceModel.set(this.getDeviceModel());
  }
  
  private getDeviceModel(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "Tablet";
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "Mobile Phone";
    }
    return "Desktop Computer";
  }

  private generateMacAddress(): string {
      return '00:1A:2B:' + Array(3).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':');
  }

  handleFileSelect(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.importFile.set(fileList[0]);
      this.notification.set(null);
    }
  }

  exportSettings() {
    const password = this.exportPassword();
    if (!password) {
        this.showNotification('error', 'Please set a password for encryption.');
        return;
    }
    
    const settingsData = {
      wallpaper: this.settingsService.wallpaper(),
      accentColor: this.settingsService.accentColor(),
    };

    const dataToExport = {
        password: password,
        settings: settingsData
    };

    const encryptedData = btoa(JSON.stringify(dataToExport));

    const blob = new Blob([encryptedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'banana-os-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('success', 'Settings exported successfully.');
    this.exportPassword.set('');
  }

  importSettings() {
    const file = this.importFile();
    const password = this.importPassword();

    if (!file) {
      this.showNotification('error', 'Please select a file to import.');
      return;
    }
    if (!password) {
      this.showNotification('error', 'Please enter the password for decryption.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const encryptedData = e.target?.result as string;
        const decryptedDataString = atob(encryptedData);
        const importedData = JSON.parse(decryptedDataString);

        if (importedData.password !== password) {
          this.showNotification('error', 'Incorrect password.');
          return;
        }

        const settings = importedData.settings as { wallpaper: string, accentColor: string };
        if (settings && settings.wallpaper && settings.accentColor) {
            // Validate values before setting
            if ((this.wallpapers.some(w => w.id === settings.wallpaper) || settings.wallpaper.startsWith('data:image')) && this.accentColors.includes(settings.accentColor)) {
                this.settingsService.setWallpaper(settings.wallpaper);
                this.settingsService.setAccentColor(settings.accentColor);
                this.showNotification('success', 'Settings imported successfully!');
                this.importPassword.set('');
                this.importFile.set(null);
                // Reset file input
                const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
                if(fileInput) fileInput.value = '';
            } else {
                 this.showNotification('error', 'Imported settings data is invalid.');
            }
        } else {
          this.showNotification('error', 'Invalid or corrupted settings file.');
        }
      } catch (error) {
        this.showNotification('error', 'Failed to read or parse the file. It may be corrupted.');
        console.error("Import error:", error);
      }
    };
    reader.onerror = () => {
        this.showNotification('error', 'Error reading the selected file.');
    }
    reader.readAsText(file);
  }

  private showNotification(type: 'success' | 'error', message: string) {
      this.notification.set({ type, message });
      setTimeout(() => this.notification.set(null), 5000);
  }

  onWallpaperFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.customWallpaperPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  setCustomWallpaper() {
    const wallpaperUrl = this.customWallpaperPreview();
    if (wallpaperUrl) {
      this.settingsService.setWallpaper(wallpaperUrl);
      this.showNotification('success', 'Wallpaper updated!');
    }
  }

  // System Action Methods
  requestRestart() {
    this.isRestartConfirmOpen.set(true);
  }

  cancelRestart() {
    this.isRestartConfirmOpen.set(false);
  }

  confirmRestart() {
    this.osInteraction.restartRequest.next();
    this.isRestartConfirmOpen.set(false);
  }

  requestFactoryReset() {
    this.isFactoryResetConfirmOpen.set(true);
  }

  cancelFactoryReset() {
    this.isFactoryResetConfirmOpen.set(false);
  }

  confirmFactoryReset() {
    this.osInteraction.factoryResetRequest.next();
    this.isFactoryResetConfirmOpen.set(false);
  }
}