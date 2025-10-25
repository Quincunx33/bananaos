import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { ApiKeyService } from '../../../services/api-key.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  notificationService = inject(NotificationService);
  apiKeyService = inject(ApiKeyService);
  activeTab = signal('personalization');

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

  // Custom Wallpaper
  customWallpaperPreview = signal<string | null>(null);
  
  // API Key Management
  geminiApiKey = signal(this.apiKeyService.apiKey() || '');
  isGeminiKeyVisible = signal(false);
  maskedGeminiApiKey = computed(() => {
    const key = this.apiKeyService.apiKey();
    if (!key) return '';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  });

  openWeatherApiKey = signal(this.apiKeyService.openWeatherApiKey() || '');
  isOpenWeatherKeyVisible = signal(false);
  maskedOpenWeatherApiKey = computed(() => {
    const key = this.apiKeyService.openWeatherApiKey();
    if (!key) return '';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  });

  handleFileSelect(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.importFile.set(fileList[0]);
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
            // Validate values before setting, allowing for base64 custom wallpapers
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

  private showNotification(type: 'success' | 'error' | 'warning' | 'info', body: string) {
      this.notificationService.show({ appId: 'settings', title: 'Settings', body, type });
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

  saveGeminiApiKey() {
    this.apiKeyService.setApiKey(this.geminiApiKey());
    if (this.geminiApiKey()) {
      this.showNotification('success', 'Gemini API key saved.');
    } else {
      this.showNotification('info', 'Gemini API key removed.');
    }
  }

  saveOpenWeatherApiKey() {
    this.apiKeyService.setOpenWeatherApiKey(this.openWeatherApiKey());
    if (this.openWeatherApiKey()) {
      this.showNotification('success', 'OpenWeatherMap API key saved.');
    } else {
      this.showNotification('info', 'OpenWeatherMap API key removed.');
    }
  }
}
