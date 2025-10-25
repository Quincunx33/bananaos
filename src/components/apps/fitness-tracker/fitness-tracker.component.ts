import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Activity {
  type: 'Running' | 'Cycling' | 'Walking';
  icon: string;
  distance: string;
  time: string;
  calories: number;
}

@Component({
  selector: 'app-fitness-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fitness-tracker.component.html',
  styleUrls: ['./fitness-tracker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FitnessTrackerComponent {
  // Simulated daily stats
  steps = signal(8245);
  calories = signal(312);
  activeMinutes = signal(45);
  distance = signal(6.5); // in km

  // Simulated weekly data (Mon-Sun)
  weeklySteps = signal([6500, 8245, 7100, 9500, 5300, 12050, 8800]);
  maxWeeklySteps = Math.max(...this.weeklySteps());

  // Simulated recent activities
  recentActivities = signal<Activity[]>([
    { type: 'Running', icon: 'fas fa-running text-blue-400', distance: '5.2 km', time: '30 min ago', calories: 250 },
    { type: 'Cycling', icon: 'fas fa-biking text-purple-400', distance: '12.5 km', time: 'Yesterday', calories: 420 },
    { type: 'Walking', icon: 'fas fa-walking text-green-400', distance: '3.1 km', time: 'Yesterday', calories: 120 },
  ]);

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  getBarHeight(steps: number): string {
    return `${(steps / this.maxWeeklySteps) * 100}%`;
  }
}
