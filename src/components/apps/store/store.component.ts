import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APPS_CONFIG } from '../../../config/apps.config';
import { AppManagementService } from '../../../services/app-management.service';
import { AppConfig } from '../../../models/app.model';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreComponent {
  private allApps = APPS_CONFIG;
  appManagementService = inject(AppManagementService);
  private notificationService = inject(NotificationService);

  categorizedApps = computed(() => {
    const categories: { [key: string]: AppConfig[] } = {};
    for (const app of this.allApps) {
      const category = app.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(app);
    }
    // Sort categories for consistent order
    const categoryOrder = ['System', 'Productivity', 'Creative', 'Utilities', 'Games', 'Social', 'Other'];
    return Object.entries(categories).sort(([a], [b]) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
  });

  install(app: AppConfig) {
    this.appManagementService.installApp(app.id);
    this.notificationService.show({ appId: 'store', title: 'App Store', body: `${app.title} installed successfully.`, type: 'success' });
  }

  uninstall(app: AppConfig) {
    this.appManagementService.uninstallApp(app.id);
    this.notificationService.show({ appId: 'store', title: 'App Store', body: `${app.title} has been uninstalled.`, type: 'info' });
  }
}
