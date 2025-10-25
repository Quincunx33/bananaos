import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var marked: {
  parse(markdown: string, options?: any): string;
};

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownEditorComponent {
  // Fix: Explicitly type the injected DomSanitizer to prevent it from being treated as 'unknown'.
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  markdownText = signal(`# Welcome to the Markdown Editor!

This is a live preview. Start typing on the left, and see the result on the right.

## Features
- **Live Preview:** See your changes instantly.
- **Easy Formatting:** Use standard Markdown syntax.
- **Syntax Highlighting:** For code blocks.

\`\`\`javascript
function greet() {
  console.log("Hello, Banana OS!");
}
\`\`\`

> This is a blockquote. Perfect for highlighting important information.

### Todo List
- [x] Create Markdown Editor
- [ ] Add more features
- [ ] Write documentation
`);
  
  htmlPreview = computed<SafeHtml>(() => {
    if (typeof marked === 'undefined') {
      return this.sanitizer.bypassSecurityTrustHtml('<p>Error: marked library not loaded.</p>');
    }
    const rawHtml = marked.parse(this.markdownText());
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });
}