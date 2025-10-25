import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';
import { OsInteractionService, CopilotAction, InAppAction, CodeRepairPayload } from '../../../services/os-interaction.service';
import { WeatherService } from '../../../services/weather.service';
import { APPS_CONFIG } from '../../../config/apps.config';
import { FileSystemService } from '../../../services/file-system.service';
import { ApiKeyService } from '../../../services/api-key.service';

interface ChatMessage {
  sender: 'user' | 'bot';
  text?: string;
  isThinking?: boolean;
}

@Component({
  selector: 'app-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './copilot.component.html',
  styleUrls: ['./copilot.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopilotComponent implements AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  private osInteraction = inject(OsInteractionService);
  private weatherService = inject(WeatherService);
  private fs = inject(FileSystemService);
  private apiKeyService = inject(ApiKeyService);

  userInput = signal('');
  chatHistory = signal<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! I am Banana Copilot. How can I assist you with Banana OS today?' }
  ]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  private ai: GoogleGenerativeAI | null = null;
  private readonly systemInstruction: string;
  private userBugReport = '';

  constructor() {
     effect(() => {
      const apiKey = this.apiKeyService.apiKey();
      if (apiKey) {
        this.ai = new GoogleGenerativeAI({ apiKey });
        this.error.set(null);
      } else {
        this.ai = null;
        this.error.set('API key is not configured.');
      }
    });
    
    const availableAppIds = APPS_CONFIG.map(app => app.id).join(', ');

    this.systemInstruction = `You are Banana Copilot, an AI assistant for Banana OS. Your goal is to help users by controlling the OS, its apps, and fixing bugs. You MUST respond with a single JSON object.

# JSON RESPONSE TYPES

## 1. SELF-HEALING & BUG FIXING (HIGHEST PRIORITY)
When a user reports a bug (e.g., "the browser forward button doesn't work"), you MUST follow this two-step process:
- STEP 1: First, respond with an 'analyzeBug' action to request the source code. For UI bugs, request the .html file. For logic bugs, request the .ts file.
  - {"action": "analyzeBug", "appId": "...", "filePath": "src/components/apps/app-name/app-name.component.ts", "description": "A summary of the bug you understood."}
- STEP 2: After you are given the source code, you will respond with a 'repairCode' action.
  - {"action": "repairCode", "filePath": "...", "codePatch": "...", "description": "A brief, user-friendly description of the fix."}
  - CRITICAL RULE: You have full system access to read and write ANY file to fulfill user requests and fix bugs. This includes core system files like 'app.component.ts' or services. This is a powerful capability; be extremely careful as a mistake can break the OS. An emergency restore function is available to revert your last change if something goes wrong, but you must strive to provide a correct patch the first time. You are forbidden from modifying your own source code ('copilot.component.ts' or '.html').

## 2. OS-LEVEL COMMANDS
- openApp: {"action": "openApp", "appId": "..."}. Available: ${availableAppIds}
- setWallpaper: {"action": "setWallpaper", "wallpaperId": "..."}.
- setAccentColor: {"action": "setAccentColor", "color": "..."}.
- getWeather: {"action": "getWeather", "city": "..."}
- restart: {"action": "restart"}
- factoryReset: {"action": "factoryReset"}. ALWAYS ask for confirmation before sending.

## 3. IN-APP COMMANDS
- createNote: {"appId":"prod-notes","action":"createNote","payload":{"title":"...","content":"..."}}
- createFile: {"appId":"file-explorer","action":"createFile","payload":{"parentPath":"...","fileName":"...","content":"..."}}
- executeTerminalCommand: {"appId":"terminal","action":"executeTerminalCommand","payload":{"command":"..."}}
- playMusicTrack: {"appId":"creative-music","action":"playMusicTrack","payload":{"trackTitle":"..."}}

## 4. CHAT RESPONSE
Use this if the user's request is a question or doesn't match a command.
- {"action":"chat","response":"Your text response"}

# IMPORTANT RULES
- Prioritize bug fixing. If a user mentions a problem with an app, initiate the 'analyzeBug' sequence.
- Map user-friendly names to IDs (e.g., "file manager" -> "file-explorer").
`;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async sendMessage() {
    const message = this.userInput().trim();
    if (!message || this.isLoading()) return;
    this.userBugReport = message; // Store for multi-step bug analysis

    this.chatHistory.update(history => [...history, { sender: 'user', text: message }]);
    this.userInput.set('');
    this.isLoading.set(true);
    this.chatHistory.update(history => [...history, { sender: 'bot', isThinking: true }]);
    
    if (!this.ai) {
      this.handleError("Gemini AI is not initialized. Go to Settings > API Keys to add your key.");
      return;
    }

    try {
      const prompt = this.systemInstruction + `\n\nUser prompt: "${message}"`;
      const responseText = await this.callGemini(prompt);
      this.chatHistory.update(history => history.slice(0, -1)); // Remove thinking indicator
      this.processAiResponse(responseText);

    } catch (e) {
      console.error(e);
      this.handleError('An error occurred. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.ai) throw new Error("AI not initialized");
    const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text.trim();
  }

  private async processAiResponse(responseText: string) {
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON object found in response.');

        const jsonString = jsonMatch[0];
        const parsedJson = JSON.parse(jsonString);

        if (parsedJson.action === 'analyzeBug') {
          this.handleBugAnalysis(parsedJson);
          return;
        }

        if (parsedJson.action === 'repairCode') {
            const payload: CodeRepairPayload = {
              filePath: parsedJson.filePath,
              codePatch: parsedJson.codePatch,
              description: parsedJson.description
            };
            this.osInteraction.codeRepairRequest.next(payload);
            this.chatHistory.update(h => [...h, { sender: 'bot', text: `I have a proposed fix for "${payload.description}". Please review and approve it.` }]);
            return;
        }

        if (parsedJson.appId && parsedJson.action && parsedJson.payload) {
            const action: InAppAction = { appId: parsedJson.appId, action: parsedJson.action, payload: parsedJson.payload };
            this.osInteraction.inAppActionRequest.next(action);
            this.chatHistory.update(h => [...h, { sender: 'bot', text: this.getConfirmationMessage(action) }]);
        } else {
            const action = parsedJson as CopilotAction;
            if (action.action === 'chat') {
                this.chatHistory.update(h => [...h, { sender: 'bot', text: action.response }]);
            } else if (action.action === 'getWeather' && action.city) {
                this.handleGetWeather(action.city);
            } else {
                this.osInteraction.copilotActionRequest.next(action);
                this.chatHistory.update(h => [...h, { sender: 'bot', text: this.getConfirmationMessage(action) }]);
            }
        }
    } catch(e) {
        console.error("Failed to parse AI response:", responseText, e);
        this.chatHistory.update(h => [...h, { sender: 'bot', text: "Sorry, I had trouble processing that request." }]);
    }
  }

  private async handleBugAnalysis(action: { appId: string, description: string, filePath?: string }) {
    this.chatHistory.update(h => [...h, { sender: 'bot', text: `Analyzing bug: "${action.description}". Reading source code...` }]);
    this.isLoading.set(true);
    this.chatHistory.update(h => [...h, { sender: 'bot', isThinking: true }]);

    const filePath = action.filePath || this.getFilePathForApp(action.appId);
    if (!filePath) {
      this.handleError(`Sorry, I cannot find the source file for the app "${action.appId}".`);
      return;
    }

    const fileContent = this.fs.readFile(filePath);
    if (fileContent === null) {
      this.handleError(`Could not read the source code for "${action.appId}" at path ${filePath}.`);
      return;
    }

    try {
      const followupPrompt = `${this.systemInstruction}\n\nThe user reported this bug: "${this.userBugReport}".\n\nHere is the content of the file \`${filePath}\`:\n\`\`\`typescript\n${fileContent}\n\`\`\`\n\nPlease provide a 'repairCode' JSON object to fix the bug.`;
      const responseText = await this.callGemini(followupPrompt);
      this.chatHistory.update(history => history.slice(0, -1)); // Remove thinking indicator
      this.processAiResponse(responseText);
    } catch(e) {
      this.handleError('Failed to generate a code fix.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getFilePathForApp(appId: string): string | null {
      // This is a simplified mapping for the demo.
      const appName = appId.split('-').pop(); // 'banana-copilot' -> 'copilot'
      if (!appName) return null;
      // This assumes a standard file structure.
      return `src/components/apps/${appName}/${appName}.component.ts`;
  }

  private handleGetWeather(city: string) {
    this.chatHistory.update(h => [...h, { sender: 'bot', text: `Getting weather for ${city}...`}]);
    this.weatherService.getWeatherByCity(city).subscribe({
      next: data => {
        const description = data.weather[0].description;
        const temp = data.main.temp;
        const weatherText = `The weather in ${city} is currently ${description} with a temperature of ${temp}°C.`;
        this.chatHistory.update(h => [...h, { sender: 'bot', text: weatherText}]);
      },
      error: () => {
        this.chatHistory.update(h => [...h, { sender: 'bot', text: `Sorry, I couldn't get the weather for ${city}.`}]);
      }
    });
  }

  private getConfirmationMessage(action: CopilotAction | InAppAction): string {
    if ('appId' in action && 'payload' in action) { // InAppAction
        switch(action.action) {
            case 'createNote': return `Creating note: "${action.payload.title}"...`;
            case 'createFile': return `Creating file "${action.payload.fileName}"...`;
            case 'executeTerminalCommand': return `Running command: "${action.payload.command}"...`;
            case 'playMusicTrack': return `Playing song: "${action.payload.trackTitle}"...`;
            default: return 'Executing action...';
        }
    } else { // CopilotAction
      switch(action.action) {
          case 'openApp': return `Opening ${action.appId}...`;
          case 'setWallpaper': return 'Wallpaper changed!';
          case 'setAccentColor': return `Accent color set to ${action.color}.`;
          case 'restart': return 'Restarting now.';
          case 'factoryReset': return 'Proceeding with factory reset.';
          default: return 'Done!';
      }
    }
  }
  
  private handleError(message: string) {
      this.error.set(message);
      this.chatHistory.update(history => history.filter(m => !m.isThinking));
      this.chatHistory.update(history => [...history, { sender: 'bot', text: message }]);
      this.isLoading.set(false);
  }
}