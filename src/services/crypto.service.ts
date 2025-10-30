import { Injectable, signal } from '@angular/core';

const CRYPTO_KEY_STORAGE_KEY = 'banana-os-crypto-key';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private cryptoKey = signal<CryptoKey | null>(null);
  private keyReady: Promise<void>;

  constructor() {
    this.keyReady = this.initializeKey();
  }

  private async initializeKey(): Promise<void> {
    if (typeof crypto === 'undefined' || typeof localStorage === 'undefined') {
        return;
    }
    try {
      const savedKey = localStorage.getItem(CRYPTO_KEY_STORAGE_KEY);
      if (savedKey) {
        const jwk = JSON.parse(savedKey);
        const key = await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
        this.cryptoKey.set(key);
      } else {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        this.cryptoKey.set(key);
        const jwk = await crypto.subtle.exportKey('jwk', key);
        localStorage.setItem(CRYPTO_KEY_STORAGE_KEY, JSON.stringify(jwk));
      }
    } catch (e) {
      console.error('Crypto key initialization failed:', e);
    }
  }

  async encrypt(plaintext: string): Promise<string> {
    await this.keyReady;
    const key = this.cryptoKey();
    if (!key || !plaintext) return plaintext;

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plaintext);
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );

      const ivString = btoa(String.fromCharCode.apply(null, Array.from(iv)));
      const ciphertextString = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))));

      return `${ivString}:${ciphertextString}`;
    } catch (e) {
      console.error('Encryption failed:', e);
      return plaintext; // Fail gracefully
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    await this.keyReady;
    const key = this.cryptoKey();
    if (!key || !encryptedData.includes(':')) return encryptedData;

    try {
      const [ivString, ciphertextString] = encryptedData.split(':');
      
      const iv = new Uint8Array(atob(ivString).split('').map(char => char.charCodeAt(0)));
      const ciphertext = new Uint8Array(atob(ciphertextString).split('').map(char => char.charCodeAt(0)));

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('Decryption failed:', e);
      return encryptedData; // Fail gracefully, maybe it wasn't encrypted
    }
  }
}
