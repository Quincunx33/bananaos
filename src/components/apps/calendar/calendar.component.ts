import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  currentDate = signal(new Date());
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthName = computed(() => this.currentDate().toLocaleString('default', { month: 'long' }));
  year = computed(() => this.currentDate().getFullYear());

  calendarGrid = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const grid: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek; i > 0; i--) {
      const day = prevMonthLastDay - i + 1;
      grid.push({
        date: new Date(year, month - 1, day),
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      grid.push({
        date: d,
        dayOfMonth: i,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
      });
    }

    // Days from next month
    const gridEndFill = 42 - grid.length; // Fill up to 6 rows
    for (let i = 1; i <= gridEndFill; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        dayOfMonth: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return grid;
  });

  goToPreviousMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  goToNextMonth() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  goToToday() {
    this.currentDate.set(new Date());
  }
}
