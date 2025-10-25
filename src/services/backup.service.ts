import { Injectable, signal } from '@angular/core';

const BACKUP_KEY = 'banana-os-emergency-backup';

interface Backup {
  filePath: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  hasBackup = signal<boolean>(false);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.hasBackup.set(localStorage.getItem(BACKUP_KEY) !== null);
    }
  }

  createBackup(filePath: string, content: string | null) {
    if (content === null) return; // Can't back up a non-existent file
    const backup: Backup = { filePath, content };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
      this.hasBackup.set(true);
    }
  }

  restoreLastBackup(): Backup | null {
    if (typeof localStorage !== 'undefined') {
      const backupJSON = localStorage.getItem(BACKUP_KEY);
      if (backupJSON) {
        try {
          return JSON.parse(backupJSON) as Backup;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  clearBackup() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(BACKUP_KEY);
      this.hasBackup.set(false);
    }
  }
}
