import { ChangeDetectionStrategy, Component, signal, effect, inject, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';
import { ApiKeyService } from '../../../services/api-key.service';

declare var hljs: any;

@Component({
  selector: 'app-banana-ide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banana-ide.component.html',
  styleUrls: ['./banana-ide.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BananaIdeComponent {
  private sanitizer = inject(DomSanitizer);
  private apiKeyService = inject(ApiKeyService);
  private ai: GoogleGenerativeAI | null = null;
  
  codeBlock = viewChild<ElementRef>('codeBlock');

  language = signal('html');
  codeContent = signal('');
  
  // For web preview
  outputHtml = signal<SafeResourceUrl | null>(null);
  // For other outputs
  outputText = signal('');

  aiPrompt = signal('');
  isLoading = signal(false);

  constructor() {
    effect(() => {
      const apiKey = this.apiKeyService.apiKey();
      if (apiKey) {
        this.ai = new GoogleGenerativeAI({ apiKey });
      } else {
        this.ai = null;
      }
    });

    this.setInitialCode();
    
    effect(() => {
      this.highlightCode();
    });
  }
  
  private highlightCode() {
    if (this.codeBlock()?.nativeElement) {
      this.codeBlock().nativeElement.innerHTML = this.codeContent()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      hljs.highlightElement(this.codeBlock().nativeElement);
    }
  }
  
  setLanguage(lang: string) {
    this.language.set(lang);
    this.setInitialCode();
  }
  
  private setInitialCode() {
    switch(this.language()) {
      case 'html':
        this.codeContent.set('<h1>Hello, Banana OS!</h1>\n<style>\n  body { \n    background-color: #1a202c; \n    color: white; \n    font-family: sans-serif; \n    text-align: center; \n    padding-top: 50px; \n  }\n</style>');
        break;
      case 'javascript':
        this.codeContent.set('// Use console.log() to see output\nconsole.log("Hello from JavaScript!");');
        break;
      case 'python':
        this.codeContent.set('# Python execution is not supported yet.\nprint("Hello from Python!")');
        break;
    }
    this.runCode();
  }
  
  runCode() {
    this.outputHtml.set(null);
    this.outputText.set('');
    
    switch (this.language()) {
      case 'html':
        this.outputHtml.set(this.sanitizer.bypassSecurityTrustResourceUrl(`data:text/html,${encodeURIComponent(this.codeContent())}`));
        break;
      case 'javascript':
        const logs: string[] = [];
        const fakeConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push(`ERROR: ${args.map(a => String(a)).join(' ')}`),
          warn: (...args: any[]) => logs.push(`WARN: ${args.map(a => String(a)).join(' ')}`),
        };
        try {
          const func = new Function('console', this.codeContent());
          func(fakeConsole);
          this.outputText.set(logs.join('\n') || 'Script executed without console output.');
        } catch (e) {
          if (e instanceof Error) {
            this.outputText.set(`Error: ${e.message}`);
          } else {
            this.outputText.set(`An unknown error occurred.`);
          }
        }
        break;
      case 'python':
        this.outputText.set('Python execution is simulated in this environment.\n\nOutput:\nHello from Python!');
        break;
    }
  }

  async generateCode() {
    if (!this.ai || !this.aiPrompt().trim()) {
        this.outputText.set('AI is not configured. Go to Settings > API Keys to add your key.');
        return;
    };

    this.isLoading.set(true);
    this.outputText.set('');
    try {
      const prompt = `Generate a single code block of ${this.language()} based on the following request. Only output the raw code, with no explanation or markdown formatting.\n\nRequest: "${this.aiPrompt()}"`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      let generatedCode = response.text;
      
      // Clean up markdown code block fences if they exist
      generatedCode = generatedCode.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '').trim();

      this.codeContent.set(generatedCode);
      this.runCode();

    } catch (e) {
      console.error(e);
      this.outputText.set('Error: Could not get response from AI.');
    } finally {
      this.isLoading.set(false);
    }
  }
}