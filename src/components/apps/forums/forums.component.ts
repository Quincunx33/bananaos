import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsInteractionService } from '../../../services/os-interaction.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forums',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForumsComponent {
  private osInteraction = inject(OsInteractionService);
  
  activeTab = signal<'social' | 'email'>('social');

  email = signal({
    to: 'nafisfuhad26@gmail.com',
    fromName: '',
    fromEmail: '',
    subject: 'Inquiry from Banana OS',
    body: 'Hello,\n\nI am reaching out to you through your Banana OS portfolio app.\n\nBest regards,'
  });

  openLink(url: string) {
    window.open(url, '_blank');
  }

  get mailtoLink(): string {
    const emailData = this.email();
    const finalBody = `${emailData.body}\n\n---\nFrom: ${emailData.fromName} (${emailData.fromEmail})`;
    return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(finalBody)}`;
  }

  updateEmailField<K extends keyof ReturnType<typeof this.email>>(
    field: K, 
    value: ReturnType<typeof this.email>[K]
  ) {
    this.email.update(e => ({ ...e, [field]: value }));
  }
}