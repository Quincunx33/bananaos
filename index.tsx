import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './src/app.component';

try {
  bootstrapApplication(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient()
    ]
  }).catch(err => {
    console.error('Angular bootstrapping failed:', err);
    displayBootstrapError(err);
  });
} catch (err: unknown) {
  console.error('Critical error before Angular bootstrap:', err);
  displayBootstrapError(err);
}

function displayBootstrapError(err: any) {
  // Ensure the body is clean before showing the error screen
  document.body.className = 'wallpaper-default';
  document.body.innerHTML = `
    <div style="position: fixed; inset: 0; background-color: rgba(17, 24, 39, 0.9); color: #f3f4f6; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; padding: 2rem; z-index: 9999;">
      <div style="text-align: center;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>Critical System Error
        </h1>
        <p style="margin-bottom: 1.5rem; text-align: center; color: #d1d5db;">Banana OS failed to start due to a critical error.</p>
        <div style="background-color: #1f2937; padding: 1rem; border-radius: 0.5rem; max-width: 80vw; max-height: 40vh; overflow: auto; margin-bottom: 1.5rem; border: 1px solid #374151; text-align: left;">
          <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 0.875rem; color: #ffcccc;">${err.message || String(err)}</pre>
        </div>
        <button id="restart-btn" style="background-color: #f59e0b; color: white; font-weight: bold; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; transition: background-color 0.2s;">
          Restart
        </button>
      </div>
    </div>
  `;
  const btn = document.getElementById('restart-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// AI Studio always uses an `index.tsx` file for all project types.