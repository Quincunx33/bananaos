import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { WINDOW_CONTEXT } from '../../../injection-tokens';

interface BrowserState {
  history: string[];
  currentIndex: number;
}

@Component({
  selector: 'app-browser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private context = inject(WINDOW_CONTEXT, { optional: true });
  
  private readonly defaultUrl = 'https://www.google.com/webhp?igu=1';
  
  state = signal<BrowserState>({
    history: [this.defaultUrl],
    currentIndex: 0,
  });
  
  reloading = signal(false);

  // --- Computed State ---
  currentUrl = computed<SafeResourceUrl>(() => {
    const s = this.state();
    const url = s.history[s.currentIndex];
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
  
  urlInput = computed<string>(() => this.state().history[this.state().currentIndex]);
  canGoBack = computed(() => this.state().currentIndex > 0);
  canGoForward = computed(() => this.state().currentIndex < this.state().history.length - 1);

  ngOnInit() {
    const urlFromContext = this.context?.url;
    if (urlFromContext) {
      this.state.set({ history: [urlFromContext], currentIndex: 0 });
    }
  }

  // --- Actions ---
  navigate(url: string) {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }

    this.state.update(s => {
      // Truncate forward history when navigating to a new page from the past.
      const newHistory = s.history.slice(0, s.currentIndex + 1);
      newHistory.push(finalUrl);
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    });
  }

  onEnter(event: Event) {
    this.navigate((event.target as HTMLInputElement).value);
  }

  goBack() {
    if (this.canGoBack()) {
      this.state.update(s => ({ ...s, currentIndex: s.currentIndex - 1 }));
    }
  }

  goForward() {
    if (this.canGoForward()) {
      this.state.update(s => ({ ...s, currentIndex: s.currentIndex + 1 }));
    }
  }

  reload() {
    // This trick forces the iframe to reload by temporarily removing it from the DOM.
    this.reloading.set(true);
    setTimeout(() => this.reloading.set(false), 20);
  }
}
