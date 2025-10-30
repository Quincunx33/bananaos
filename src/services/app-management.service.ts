
import { Injectable, signal, effect, computed } from '@angular/core';
import { APPS_CONFIG } from '../config/apps.config';
import { AppConfig } from '../models/app.model';

const INSTALLED_APPS_KEY = 'banana-os-installed-apps';
const CUSTOM_APPS_KEY = 'banana-os-custom-apps';

export type ProjectType = 'simple' | 'react';

export interface AppCode {
    html: string;
    css: string;
    js: string;
}
  
export interface CustomApp extends AppConfig {
    projectType: ProjectType;
    code: AppCode;
}

@Injectable({ providedIn: 'root' })
export class AppManagementService {
  private readonly coreAppIds = APPS_CONFIG.filter(app => app.isCore).map(app => app.id);
  
  installedAppIds = signal<string[]>(this.getInitialInstalledApps());
  customApps = signal<CustomApp[]>(this.loadCustomApps());

  allApps = computed(() => [...APPS_CONFIG, ...this.customApps()]);

  constructor() {
    effect(() => {
      localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(this.installedAppIds()));
    });
    effect(() => {
      localStorage.setItem(CUSTOM_APPS_KEY, JSON.stringify(this.customApps()));
    });
  }

  private getInitialInstalledApps(): string[] {
    const savedAppsJson = localStorage.getItem(INSTALLED_APPS_KEY);
    if (savedAppsJson) {
      try {
        const savedApps = JSON.parse(savedAppsJson) as string[];
        const fullList = [...new Set([...this.coreAppIds, ...savedApps])];
        return fullList;
      } catch (e) {
        return [...this.coreAppIds];
      }
    }
    return [...this.coreAppIds];
  }
  
  private loadCustomApps(): CustomApp[] {
    const savedJson = localStorage.getItem(CUSTOM_APPS_KEY);
    if (savedJson) {
      try {
        return JSON.parse(savedJson);
      } catch (e) {
        return [];
      }
    }
    return [];
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
    
    if(appId.startsWith('custom-')) {
        this.customApps.update(apps => apps.filter(app => app.id !== appId));
    }

    this.installedAppIds.update(ids => ids.filter(id => id !== appId));
  }
  
  uninstallAllNonCoreApps() {
    this.customApps.set([]);
    this.installedAppIds.set([...this.coreAppIds]);
  }

  addCustomApp(data: { title: string; icon: string; projectType: ProjectType; code: AppCode }) {
    const newApp: CustomApp = {
        id: `custom-${Date.now()}`,
        title: data.title,
        icon: data.icon,
        projectType: data.projectType,
        code: data.code,
        category: 'Other',
        description: 'A user-created application.'
    };

    this.customApps.update(apps => [...apps, newApp]);
    this.installApp(newApp.id);
  }

  getCustomApp(appId: string): CustomApp | undefined {
    return this.customApps().find(app => app.id === appId);
  }
}