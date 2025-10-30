import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { CryptoService } from './crypto.service';

const ENCRYPTION_PREFIX = 'enc_v1::';

const GEMINI_API_KEY_STORAGE_KEY = 'banana-os-gemini-api-key';
const OPENWEATHER_API_KEY_STORAGE_KEY = 'banana-os-openweather-api-key';
const OPENAI_API_KEY_STORAGE_KEY = 'banana-os-openai-api-key';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private cryptoService = inject(CryptoService);

  apiKey = signal<string | null>(null); // Gemini API Key
  openAiApiKey = signal<string | null>(null);
  openWeatherApiKey = signal<string | null>(null);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.loadInitialKeys();
    }
  }

  private async loadInitialKeys() {
    await this.loadKey(GEMINI_API_KEY_STORAGE_KEY, this.apiKey);
    await this.loadKey(OPENAI_API_KEY_STORAGE_KEY, this.openAiApiKey);
    await this.loadKey(OPENWEATHER_API_KEY_STORAGE_KEY, this.openWeatherApiKey);
  }

  private async loadKey(storageKey: string, keySignal: WritableSignal<string | null>) {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue) {
      if (storedValue.startsWith(ENCRYPTION_PREFIX)) {
        const encryptedPart = storedValue.substring(ENCRYPTION_PREFIX.length);
        try {
          const decryptedValue = await this.cryptoService.decrypt(encryptedPart);
          keySignal.set(decryptedValue);
        } catch {
          keySignal.set(null);
          localStorage.removeItem(storageKey);
        }
      } else {
        // Handle legacy plaintext keys by encrypting them
        keySignal.set(storedValue);
        await this.setKey(storedValue, keySignal, storageKey); // This will re-save it as encrypted
      }
    }
  }

  private async setKey(key: string, keySignal: WritableSignal<string | null>, storageKey: string) {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      keySignal.set(trimmedKey);
      const encryptedKey = await this.cryptoService.encrypt(trimmedKey);
      localStorage.setItem(storageKey, `${ENCRYPTION_PREFIX}${encryptedKey}`);
    } else {
      keySignal.set(null);
      localStorage.removeItem(storageKey);
    }
  }

  async setApiKey(key: string) {
    await this.setKey(key, this.apiKey, GEMINI_API_KEY_STORAGE_KEY);
  }
  
  async setOpenAiApiKey(key: string) {
    await this.setKey(key, this.openAiApiKey, OPENAI_API_KEY_STORAGE_KEY);
  }

  async setOpenWeatherApiKey(key: string) {
    await this.setKey(key, this.openWeatherApiKey, OPENWEATHER_API_KEY_STORAGE_KEY);
  }
}