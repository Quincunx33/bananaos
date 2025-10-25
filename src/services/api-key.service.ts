import { Injectable, signal } from '@angular/core';

const API_KEY_STORAGE_KEY = 'banana-os-gemini-api-key';
const OPENWEATHER_API_KEY_STORAGE_KEY = 'banana-os-openweather-api-key';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  apiKey = signal<string | null>(null);
  openWeatherApiKey = signal<string | null>(null);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (savedKey) {
        this.apiKey.set(savedKey);
      }
      const savedWeatherKey = localStorage.getItem(OPENWEATHER_API_KEY_STORAGE_KEY);
      if (savedWeatherKey) {
        this.openWeatherApiKey.set(savedWeatherKey);
      }
    }
  }

  setApiKey(key: string) {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      this.apiKey.set(trimmedKey);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
      }
    } else {
      this.apiKey.set(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    }
  }

  setOpenWeatherApiKey(key: string) {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      this.openWeatherApiKey.set(trimmedKey);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(OPENWEATHER_API_KEY_STORAGE_KEY, trimmedKey);
      }
    } else {
      this.openWeatherApiKey.set(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(OPENWEATHER_API_KEY_STORAGE_KEY);
      }
    }
  }
}
