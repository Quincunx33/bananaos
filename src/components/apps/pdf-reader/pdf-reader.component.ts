import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-reader.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfReaderComponent implements OnDestroy {
  // Fix: Explicitly type the injected DomSanitizer to prevent it from being treated as 'unknown'.
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  pdfSrc = signal<SafeResourceUrl | null>(null);
  error = signal<string | null>(null);
  fileName = signal<string | null>(null);

  private currentObjectUrl: string | null = null;

  ngOnDestroy() {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }
  }

  openLocalFile(event: Event) {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.error.set('Selected file is not a PDF.');
        this.pdfSrc.set(null);
        this.fileName.set(null);
        return;
      }
      
      this.currentObjectUrl = URL.createObjectURL(file);
      this.pdfSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.currentObjectUrl));
      this.fileName.set(file.name);
      this.error.set(null);
    }
  }
}