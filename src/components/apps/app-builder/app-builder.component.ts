import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppManagementService } from '../../../services/app-management.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-builder.component.html',
  styleUrls: ['./app-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBuilderComponent {
  private appManagement = inject(AppManagementService);
  private notificationService = inject(NotificationService);

  // App Metadata
  appName = signal('My New App');
  
  // File Content/Data
  htmlContent = signal<string | null>(null);
  cssContent = signal<string>('');
  jsContent = signal<string>('');
  iconDataUrl = signal<string | null>(null);

  // File Names for UI
  htmlFileName = signal<string | null>(null);
  cssFileName = signal<string | null>(null);
  jsFileName = signal<string | null>(null);
  iconFileName = signal<string | null>(null);

  handleFileSelect(event: Event, type: 'html' | 'css' | 'js' | 'icon') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (type === 'icon') {
      if (!file.type.startsWith('image/')) {
        this.notificationService.show({
          appId: 'app-builder', title: 'App Builder',
          body: 'Icon must be an image file.', type: 'error'
        });
        return;
      }
      reader.onload = (e) => {
        this.iconDataUrl.set(e.target?.result as string);
        this.iconFileName.set(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const content = e.target?.result as string;
        switch (type) {
          case 'html':
            this.htmlContent.set(content);
            this.htmlFileName.set(file.name);
            break;
          case 'css':
            this.cssContent.set(content);
            this.cssFileName.set(file.name);
            break;
          case 'js':
            this.jsContent.set(content);
            this.jsFileName.set(file.name);
            break;
        }
      };
      reader.readAsText(file);
    }
    // Reset file input to allow re-uploading the same file
    input.value = '';
  }

  clearFile(type: 'html' | 'css' | 'js' | 'icon') {
    switch (type) {
      case 'html':
        this.htmlContent.set(null);
        this.htmlFileName.set(null);
        break;
      case 'css':
        this.cssContent.set('');
        this.cssFileName.set(null);
        break;
      case 'js':
        this.jsContent.set('');
        this.jsFileName.set(null);
        break;
      case 'icon':
        this.iconDataUrl.set(null);
        this.iconFileName.set(null);
        break;
    }
  }

  installApp() {
    if (!this.appName().trim()) {
      this.showError('Please provide an app name.');
      return;
    }
    if (!this.iconDataUrl()) {
      this.showError('Please upload an app icon.');
      return;
    }
    if (!this.htmlContent()) {
      this.showError('An HTML file is required to build the app.');
      return;
    }

    this.appManagement.addCustomApp({
      title: this.appName(),
      icon: this.iconDataUrl()!,
      projectType: 'simple', // Hardcoded as per new design
      code: {
        html: this.htmlContent()!,
        css: this.cssContent(),
        js: this.jsContent()
      }
    });

    this.notificationService.show({
      appId: 'app-builder',
      title: 'App Builder',
      body: `App "${this.appName()}" installed successfully! Find it in the Start Menu.`,
      type: 'success'
    });
  }

  private showError(message: string) {
    this.notificationService.show({
      appId: 'app-builder',
      title: 'App Builder',
      body: message,
      type: 'error'
    });
  }
}
