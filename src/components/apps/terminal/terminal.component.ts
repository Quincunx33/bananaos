import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';
import { NotificationService } from '../../../services/notification.service';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { ApiKeyService } from '../../../services/api-key.service';

interface TerminalLine {
  type: 'command' | 'response';
  text: string;
  isThinking?: boolean;
}

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TerminalComponent {
  lines = signal<TerminalLine[]>([
    { type: 'response', text: "Welcome to Banana OS Terminal. Type 'help' for commands." }
  ]);
  
  @ViewChild('input') inputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('output') outputEl!: ElementRef<HTMLDivElement>;

  private notificationService = inject(NotificationService);
  private osInteraction = inject(OsInteractionService);
  private apiKeyService = inject(ApiKeyService);
  private destroyRef = inject(DestroyRef);
  private ai: GoogleGenerativeAI | null = null;
  
  constructor() {
    effect(() => {
      const apiKey = this.apiKeyService.apiKey();
      if (apiKey) {
        this.ai = new GoogleGenerativeAI({ apiKey });
      } else {
        this.ai = null;
      }
    });

    this.osInteraction.inAppActionRequest
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(action => {
        if (action.appId === 'terminal' && action.action === 'executeTerminalCommand') {
          this.runCommand(action.payload.command);
        }
      });
  }

  async processCommand(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    if (!input) return;

    this.runCommand(input);
    (event.target as HTMLInputElement).value = '';
  }
  
  async runCommand(command: string) {
    this.lines.update(current => [...current, { type: 'command', text: command }]);

    const [cmd] = command.trim().toLowerCase().split(' ');
    if (cmd === 'ai') {
        this.lines.update(current => [...current, { type: 'response', text: 'Thinking...', isThinking: true }]);
        this.scrollToBottom();
    }

    const response = await this.getCommandResponse(command.trim());
    
    this.lines.update(current => {
        const newLines = [...current];
        const lastLine = newLines[newLines.length - 1];

        if (lastLine?.isThinking) {
            if (response) {
                lastLine.text = response;
                delete lastLine.isThinking;
            } else {
                newLines.pop(); // Remove thinking line if no response
            }
        } else if (response) {
            newLines.push({ type: 'response', text: response });
        }
        return newLines;
    });

    this.scrollToBottom();
  }

  private scrollToBottom() {
      setTimeout(() => {
        if (this.outputEl) {
            this.outputEl.nativeElement.scrollTop = this.outputEl.nativeElement.scrollHeight;
        }
    });
  }

  private async getCommandResponse(command: string): Promise<string | null> {
    const [cmd, ...args] = command.split(' ');
    switch (cmd.toLowerCase()) {
      case 'help':
        return "Available: help, clear, date, echo, neofetch, ai";
      case 'clear':
        this.lines.set([]);
        return null;
      case 'date':
        return new Date().toString();
      case 'echo':
        return args.join(' ');
      case 'neofetch':
        return `
🍌 Banana OS v1.0
-----------------
OS: Banana OS (Angular)
Kernel: Web Browser
Resolution: ${window.innerWidth}x${window.innerHeight}
Theme: Dark
        `.trim();
      case 'ai':
        if (!this.ai) {
          const errorMessage = 'AI is not configured. Go to Settings > API Keys to add your Gemini API key.';
          this.notificationService.show({ appId: 'terminal', title: 'Terminal', body: errorMessage, type: 'error' });
          return `Error: ${errorMessage}`;
        }
        try {
          const prompt = args.join(' ');
          if (!prompt) return 'Please provide a prompt for the AI. Usage: ai "your question"';
          
          const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          return response.text;
        } catch (e) {
          console.error(e);
          this.notificationService.show({ appId: 'terminal', title: 'Terminal', body: 'Could not get response from AI.', type: 'error' });
          return 'Error: Could not get a response from the AI.';
        }
      default:
        return `Command not found: ${cmd}`;
    }
  }

  focusInput() {
    this.inputEl?.nativeElement.focus();
  }
}