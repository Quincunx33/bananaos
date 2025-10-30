import { Injectable, inject, signal, effect, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SystemPreferencesService } from './system-preferences.service';
import { AuthService } from './auth.service';

const LOCK_STATE_KEY = 'banana-os-lock-state';

@Injectable({ providedIn: 'root' })
export class LockScreenService implements OnDestroy {
  private systemPreferences = inject(SystemPreferencesService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  
  isLocked = signal(this.loadLockState());
  
  private inactivityTimer: any;
  private readonly activityEvents = ['mousemove', 'keydown', 'mousedown', 'scroll'];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.activityEvents.forEach(event => document.addEventListener(event, this.resetInactivityTimer));
      
      // Persists the lock state to localStorage
      effect(() => {
          localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(this.isLocked()));
      });
      
      // Handles timer logic and auto-unlock on password removal
      effect(() => {
        this.resetInactivityTimer();

        if (!this.authService.isPasswordSet() && this.isLocked()) {
            this.isLocked.set(false);
        }
      });
    }
  }

  private loadLockState(): boolean {
      if (isPlatformBrowser(this.platformId)) {
          try {
              const savedState = localStorage.getItem(LOCK_STATE_KEY);
              // Only consider locked if a password is also set. Prevents being locked out
              // if password is cleared from storage but lock state remains.
              return savedState === 'true' && !!localStorage.getItem('banana-os-password-hash');
          } catch {
              return false;
          }
      }
      return false;
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.activityEvents.forEach(event => document.removeEventListener(event, this.resetInactivityTimer));
      clearTimeout(this.inactivityTimer);
    }
  }

  resetInactivityTimer = (): void => {
    clearTimeout(this.inactivityTimer);
    
    if (this.isLocked() || !this.authService.isPasswordSet()) return;

    const timeoutMinutes = this.systemPreferences.screenLockTimeout();
    if (timeoutMinutes > 0) {
      this.inactivityTimer = setTimeout(() => this.lockNow(), timeoutMinutes * 60 * 1000);
    }
  }

  lockNow(): void {
    if (this.authService.isPasswordSet()) {
      this.isLocked.set(true);
      clearTimeout(this.inactivityTimer);
    }
  }

  async unlock(password: string): Promise<boolean> {
    const success = await this.authService.verifyPassword(password);
    if (success) {
      this.isLocked.set(false);
      this.resetInactivityTimer();
    }
    return success;
  }
}
