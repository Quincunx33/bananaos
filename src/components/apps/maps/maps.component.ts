import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsComponent {
  // Fix: Explicitly type the injected DomSanitizer to prevent it from being treated as 'unknown'.
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  
  searchQuery = signal('Eiffel Tower');
  
  mapUrl = computed<SafeResourceUrl>(() => {
    const query = this.searchQuery();
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.searchQuery.set(input.value);
    }
  }
}