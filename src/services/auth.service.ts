import { Injectable, signal, inject, computed } from '@angular/core';
import { CryptoService } from './crypto.service';

const PASSWORD_HASH_KEY = 'banana-os-password-hash';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private cryptoService = inject(CryptoService);
  private passwordHash = signal<string | null>(null);

  isPasswordSet = computed(() => this.passwordHash() !== null);

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.passwordHash.set(localStorage.getItem(PASSWORD_HASH_KEY));
    }
  }

  async setPassword(password: string): Promise<void> {
    const hash = await this.cryptoService.encrypt(password);
    this.passwordHash.set(hash);
    localStorage.setItem(PASSWORD_HASH_KEY, hash);
  }

  async verifyPassword(password: string): Promise<boolean> {
    const storedHash = this.passwordHash();
    if (!storedHash) return false;

    try {
      const decryptedPassword = await this.cryptoService.decrypt(storedHash);
      return password === decryptedPassword;
    } catch (e) {
      console.error("Password verification failed during decryption:", e);
      return false; // Treat decryption failure as a failed verification
    }
  }

  removePassword(): void {
    this.passwordHash.set(null);
    localStorage.removeItem(PASSWORD_HASH_KEY);
  }
}
