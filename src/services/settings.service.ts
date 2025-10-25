
import { Injectable, signal, effect } from '@angular/core';

const WALLPAPER_KEY = 'banana-os-wallpaper';
const ACCENT_COLOR_KEY = 'banana-os-accent-color';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  wallpaper = signal<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(WALLPAPER_KEY) || 'wallpaper-default' : 'wallpaper-default'
  );
  accentColor = signal<string>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(ACCENT_COLOR_KEY) || 'blue' : 'blue'
  );

  constructor() {
    effect(() => {
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem(WALLPAPER_KEY, this.wallpaper());
      }
    });
    effect(() => {
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem(ACCENT_COLOR_KEY, this.accentColor());
      }
    });
  }

  setWallpaper(wallpaperClass: string) {
    this.wallpaper.set(wallpaperClass);
  }

  setAccentColor(color: string) {
    this.accentColor.set(color);
  }

  resetToDefaults() {
    this.setWallpaper('wallpaper-default');
    this.setAccentColor('blue');
  }
}
