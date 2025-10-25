import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <div class="h-full w-full flex flex-col items-center justify-center bg-gray-800 text-gray-400 p-8 text-center">
      <i class="fas fa-tools text-6xl mb-4"></i>
      <h2 class="text-2xl font-bold text-white mb-2">Under Construction</h2>
      <p>This application is coming soon to Banana OS!</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderAppComponent {}
