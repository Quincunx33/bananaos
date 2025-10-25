import { ChangeDetectionStrategy, Component, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleGenerativeAI } from '@google/genai';
import { ApiKeyService } from '../../../services/api-key.service';

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './translator.component.html',
  styleUrls: ['./translator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslatorComponent {
  inputText = signal('');
  translatedText = signal('');
  sourceLang = signal('English');
  targetLang = signal('Spanish');
  isLoading = signal(false);
  error = signal<string | null>(null);

  languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Russian', 'Arabic'];

  private apiKeyService = inject(ApiKeyService);
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    effect(() => {
      const apiKey = this.apiKeyService.apiKey();
      if (apiKey) {
        this.ai = new GoogleGenerativeAI(apiKey);
        this.error.set(null);
      } else {
        this.ai = null;
        this.error.set('API key is not configured.');
      }
    });
  }

  swapLanguages() {
    const source = this.sourceLang();
    const target = this.targetLang();
    this.sourceLang.set(target);
    this.targetLang.set(source);
  }

  async translate() {
    if (!this.ai) {
      this.error.set('Gemini AI is not initialized. Go to Settings > API Keys to add your key.');
      return;
    }
    if (!this.inputText().trim()) {
      return;
    }
    
    this.isLoading.set(true);
    this.error.set(null);
    this.translatedText.set('');

    try {
      const prompt = `Translate the following text from ${this.sourceLang()} to ${this.targetLang()}. Only return the translated text, without any additional explanation or introduction.\n\nText: "${this.inputText()}"`;
      
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      this.translatedText.set(response.text().trim());

    } catch (e) {
      console.error(e);
      this.error.set('An error occurred while translating. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}