
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
      console.warn(`Attempted to uninstall a core app: ${appId}`);
      return;
    }
    this.installedAppIds.update(ids => ids.filter(id => id !== appId));
  }
  
  uninstallAllNonCoreApps() {
    this.installedAppIds.set([...this.coreAppIds]);
  }
}
