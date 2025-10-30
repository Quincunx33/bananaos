import { Injectable, signal, effect } from '@angular/core';

// Define keys for localStorage
export const DND_KEY = 'banana-os-dnd';
export const VOLUME_KEY = 'banana-os-volume';
export const SYSTEM_SOUNDS_KEY = 'banana-os-system-sounds';
export const LANGUAGE_KEY = 'banana-os-language';
export const TIME_FORMAT_KEY = 'banana-os-time-format';
export const MOUSE_SPEED_KEY = 'banana-os-mouse-speed';
export const SCROLL_SPEED_KEY = 'banana-os-scroll-speed';
export const PRIMARY_MOUSE_BUTTON_KEY = 'banana-os-primary-mouse-button';
export const SCREEN_LOCK_TIMEOUT_KEY = 'banana-os-screen-lock-timeout';
export const POWER_MODE_KEY = 'banana-os-power-mode';

export const ALL_PREFERENCE_KEYS = [
  DND_KEY, VOLUME_KEY, SYSTEM_SOUNDS_KEY, LANGUAGE_KEY, TIME_FORMAT_KEY,
  MOUSE_SPEED_KEY, SCROLL_SPEED_KEY, PRIMARY_MOUSE_BUTTON_KEY, SCREEN_LOCK_TIMEOUT_KEY, POWER_MODE_KEY
];


@Injectable({ providedIn: 'root' })
export class SystemPreferencesService {
  dndEnabled = signal<boolean>(this.loadFromStorage(DND_KEY, false));
  masterVolume = signal<number>(this.loadFromStorage(VOLUME_KEY, 80));
  systemSoundsEnabled = signal<boolean>(this.loadFromStorage(SYSTEM_SOUNDS_KEY, true));

  language = signal<'en-US' | 'bn-BD'>(this.loadFromStorage(LANGUAGE_KEY, 'en-US'));
  timeFormat = signal<'12h' | '24h'>(this.loadFromStorage(TIME_FORMAT_KEY, '12h'));

  mouseSpeed = signal<number>(this.loadFromStorage(MOUSE_SPEED_KEY, 50));
  scrollSpeed = signal<number>(this.loadFromStorage(SCROLL_SPEED_KEY, 50));
  primaryMouseButton = signal<'left' | 'right'>(this.loadFromStorage(PRIMARY_MOUSE_BUTTON_KEY, 'left'));
  
  screenLockTimeout = signal<number>(this.loadFromStorage(SCREEN_LOCK_TIMEOUT_KEY, 5)); // in minutes, 0 for never
  
  powerMode = signal<'balanced' | 'performance' | 'power-saving'>(this.loadFromStorage(POWER_MODE_KEY, 'balanced'));

  constructor() {
    this.createEffect(this.dndEnabled, DND_KEY);
    this.createEffect(this.masterVolume, VOLUME_KEY);
    this.createEffect(this.systemSoundsEnabled, SYSTEM_SOUNDS_KEY);
    this.createEffect(this.language, LANGUAGE_KEY);
    this.createEffect(this.timeFormat, TIME_FORMAT_KEY);
    this.createEffect(this.mouseSpeed, MOUSE_SPEED_KEY);
    this.createEffect(this.scrollSpeed, SCROLL_SPEED_KEY);
    this.createEffect(this.primaryMouseButton, PRIMARY_MOUSE_BUTTON_KEY);
    this.createEffect(this.screenLockTimeout, SCREEN_LOCK_TIMEOUT_KEY);
    this.createEffect(this.powerMode, POWER_MODE_KEY);
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof localStorage === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private createEffect<T>(sig: ReturnType<typeof signal<T>>, key: string) {
    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(sig()));
      }
    });
  }
  
  resetAllToDefaults() {
    this.dndEnabled.set(false);
    this.masterVolume.set(80);
    this.systemSoundsEnabled.set(true);
    this.language.set('en-US');
    this.timeFormat.set('12h');
    this.mouseSpeed.set(50);
    this.scrollSpeed.set(50);
    this.primaryMouseButton.set('left');
    this.screenLockTimeout.set(5);
    this.powerMode.set('balanced');
  }
}
