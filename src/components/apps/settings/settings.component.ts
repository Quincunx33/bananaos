import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { ApiKeyService } from '../../../services/api-key.service';
import { FormsModule } from '@angular/forms';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { IpService } from '../../../services/ip.service';
import { SystemPreferencesService } from '../../../services/system-preferences.service';
import { AuthService } from '../../../services/auth.service';
import { LockScreenService } from '../../../services/lock-screen.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class SettingsComponent implements OnInit {
  settingsService = inject(SettingsService);
  notificationService = inject(NotificationService);
  apiKeyService = inject(ApiKeyService);
  osInteraction = inject(OsInteractionService);
  systemPreferences = inject(SystemPreferencesService);
  authService = inject(AuthService);
  lockScreenService = inject(LockScreenService);
  private ipService = inject(IpService);
  
  activeTab = signal('security');
  isPasswordSet = this.authService.isPasswordSet;

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
  lastExportTime = signal<number | null>(null);

  // Custom Wallpaper
  customWallpaperPreview = signal<string | null>(null);
  
  // API Key Management
  geminiApiKey = signal(this.apiKeyService.apiKey() || '');
  isGeminiKeyVisible = signal(false);
  maskedGeminiApiKey = computed(() => this.maskKey(this.apiKeyService.apiKey()));

  openAiApiKey = signal(this.apiKeyService.openAiApiKey() || '');
  isOpenAiKeyVisible = signal(false);
  maskedOpenAiApiKey = computed(() => this.maskKey(this.apiKeyService.openAiApiKey()));

  openWeatherApiKey = signal(this.apiKeyService.openWeatherApiKey() || '');
  isOpenWeatherKeyVisible = signal(false);
  maskedOpenWeatherApiKey = computed(() => this.maskKey(this.apiKeyService.openWeatherApiKey()));

  // System Info
  ipAddress = signal('Loading...');
  macAddress = signal('N/A');
  deviceModel = signal('N/A');
  year = new Date().getFullYear();

  // System Reset Modals
  isFactoryResetConfirmOpen = signal(false);
  isResetAccountConfirmOpen = signal(false);
  isClearDataConfirmOpen = signal(false);

  // New settings UI properties
  lockTimeouts = [
    { value: 1, label: '1 Minute' },
    { value: 5, label: '5 Minutes' },
    { value: 15, label: '15 Minutes' },
    { value: 30, label: '30 Minutes' },
    { value: 0, label: 'Never' },
  ];
  
  languages = [
      { id: 'en-US', name: 'English (US)' },
      { id: 'bn-BD', name: 'বাংলা (Bengali)' },
      { id: 'es-ES', name: 'Español (Spanish)' },
      { id: 'fr-FR', name: 'Français (French)' },
      { id: 'de-DE', name: 'Deutsch (German)' },
      { id: 'zh-CN', name: '中文 (Chinese)' },
      { id: 'hi-IN', name: 'हिन्दी (Hindi)' },
  ];

  // Password Management
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  
  isCurrentPasswordVisible = signal(false);
  isNewPasswordVisible = signal(false);
  isConfirmPasswordVisible = signal(false);

  ngOnInit() {
    this.ipService.getPublicIp().subscribe({
      next: ip => this.ipAddress.set(ip),
      error: () => this.ipAddress.set('Unavailable')
    });
    this.macAddress.set(this.generateMacAddress());
    this.deviceModel.set(this.getDeviceModel());
    const lastExport = localStorage.getItem('banana-os-last-export-time');
    if (lastExport) {
        this.lastExportTime.set(parseInt(lastExport, 10));
    }
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

  private maskKey(key: string | null): string {
    if (!key) return '';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  handleFileSelect(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.importFile.set(fileList[0]);
    }
  }

  async exportSettings() {
    const password = this.exportPassword();
    if (!password) {
      this.showNotification('error', 'Please set a password for encryption.');
      return;
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.getKey(password, salt);

      const settingsData = {
        wallpaper: this.settingsService.wallpaper(),
        accentColor: this.settingsService.accentColor(),
      };
      const plaintext = new TextEncoder().encode(JSON.stringify(settingsData));

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
      );

      const dataToExport = {
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
        ciphertext: this.arrayBufferToBase64(ciphertext),
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'banana-os-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const timestamp = Date.now();
      localStorage.setItem('banana-os-last-export-time', timestamp.toString());
      this.lastExportTime.set(timestamp);

      this.showNotification('success', 'Settings exported successfully.');
      this.exportPassword.set('');
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('error', 'Failed to encrypt and export settings.');
    }
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
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        const importedData = JSON.parse(fileContent);

        if (!importedData.salt || !importedData.iv || !importedData.ciphertext) {
          throw new Error('Invalid file format.');
        }

        const salt = this.base64ToArrayBuffer(importedData.salt);
        const iv = this.base64ToArrayBuffer(importedData.iv);
        const ciphertext = this.base64ToArrayBuffer(importedData.ciphertext);

        const key = await this.getKey(password, new Uint8Array(salt));

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          ciphertext
        );
        
        const decryptedString = new TextDecoder().decode(decrypted);
        const settings = JSON.parse(decryptedString) as { wallpaper: string, accentColor: string };

        if (settings && settings.wallpaper && settings.accentColor) {
            if ((this.wallpapers.some(w => w.id === settings.wallpaper) || settings.wallpaper.startsWith('data:image')) && this.accentColors.includes(settings.accentColor)) {
                this.settingsService.setWallpaper(settings.wallpaper);
                this.settingsService.setAccentColor(settings.accentColor);
                this.showNotification('success', 'Settings imported successfully!');
                this.importPassword.set('');
                this.importFile.set(null);
                const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
                if(fileInput) fileInput.value = '';
            } else {
                 this.showNotification('error', 'Imported settings data is invalid.');
            }
        } else {
          this.showNotification('error', 'Invalid or corrupted settings file.');
        }
      } catch (error) {
        console.error("Import error:", error);
        this.showNotification('error', 'Failed to decrypt. Check password or file integrity.');
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

  async saveGeminiApiKey() {
    await this.apiKeyService.setApiKey(this.geminiApiKey());
    this.showNotification(this.geminiApiKey() ? 'success' : 'info', 'Gemini API key ' + (this.geminiApiKey() ? 'saved.' : 'removed.'));
  }
  
  async saveOpenAiApiKey() {
    await this.apiKeyService.setOpenAiApiKey(this.openAiApiKey());
    this.showNotification(this.openAiApiKey() ? 'success' : 'info', 'OpenAI API key ' + (this.openAiApiKey() ? 'saved.' : 'removed.'));
  }

  async saveOpenWeatherApiKey() {
    await this.apiKeyService.setOpenWeatherApiKey(this.openWeatherApiKey());
    this.showNotification(this.openWeatherApiKey() ? 'success' : 'info', 'OpenWeatherMap API key ' + (this.openWeatherApiKey() ? 'saved.' : 'removed.'));
  }
  
  private getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    ).then(baseKey =>
      crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
    );
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // System Action Methods
  requestFactoryReset() { this.isFactoryResetConfirmOpen.set(true); }
  cancelFactoryReset() { this.isFactoryResetConfirmOpen.set(false); }
  confirmFactoryReset() {
    this.osInteraction.factoryResetRequest.next();
    this.isFactoryResetConfirmOpen.set(false);
    this.showNotification('warning', 'Factory reset initiated.');
  }

  requestResetAccount() { this.isResetAccountConfirmOpen.set(true); }
  cancelResetAccount() { this.isResetAccountConfirmOpen.set(false); }
  confirmResetAccount() {
    this.settingsService.resetToDefaults();
    this.systemPreferences.resetAllToDefaults();
    this.isResetAccountConfirmOpen.set(false);
    this.showNotification('success', 'Personalization settings have been reset.');
  }

  requestClearData() { this.isClearDataConfirmOpen.set(true); }
  cancelClearData() { this.isClearDataConfirmOpen.set(false); }
  confirmClearData() {
    const keysToKeep = ['banana-os-crypto-key'];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    this.isClearDataConfirmOpen.set(false);
    this.showNotification('warning', 'All application data cleared. Restarting OS...');

    setTimeout(() => window.location.reload(), 1500);
  }

  // Password Management Methods
  toggleCurrentPasswordVisibility() {
    this.isCurrentPasswordVisible.update(v => !v);
  }

  toggleNewPasswordVisibility() {
    this.isNewPasswordVisible.update(v => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.isConfirmPasswordVisible.update(v => !v);
  }

  async setPassword() {
    if (!this.newPassword()) {
      this.showNotification('error', 'New password cannot be empty.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.showNotification('error', 'Passwords do not match.');
      return;
    }
    await this.authService.setPassword(this.newPassword());
    this.showNotification('success', 'Password has been set.');
    this.clearPasswordFields();
  }

  async changePassword() {
    const isVerified = await this.authService.verifyPassword(this.currentPassword());
    if (!isVerified) {
      this.showNotification('error', 'Current password is incorrect.');
      return;
    }
    if (!this.newPassword()) {
      this.showNotification('error', 'New password cannot be empty.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.showNotification('error', 'New passwords do not match.');
      return;
    }
    await this.authService.setPassword(this.newPassword());
    this.showNotification('success', 'Password has been changed.');
    this.clearPasswordFields();
  }

  async removePassword() {
    const isVerified = await this.authService.verifyPassword(this.currentPassword());
    if (!isVerified) {
      this.showNotification('error', 'Password is incorrect.');
      return;
    }
    this.authService.removePassword();
    this.showNotification('success', 'Password has been removed.');
    this.clearPasswordFields();
  }

  private clearPasswordFields() {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  lockNow() {
    this.lockScreenService.lockNow();
  }
}