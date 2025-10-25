import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './clock.component.html',
  styleUrls: ['./clock.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClockComponent implements OnInit, OnDestroy {
  activeTab = signal<'clock' | 'stopwatch' | 'timer'>('clock');
  currentTime = signal(new Date());

  // Stopwatch
  stopwatchTime = signal(0);
  isStopwatchRunning = signal(false);
  private stopwatchInterval: any;

  // Timer
  timerInputHours = signal(0);
  timerInputMinutes = signal(5);
  timerInputSeconds = signal(0);
  timerTime = signal(300); // 5 minutes in seconds
  isTimerRunning = signal(false);
  private timerInterval: any;
  private timerAudio: HTMLAudioElement;

  private clockInterval: any;

  constructor() {
    this.timerAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    this.timerAudio.loop = true;
  }

  ngOnInit() {
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.clockInterval);
    clearInterval(this.stopwatchInterval);
    clearInterval(this.timerInterval);
    this.timerAudio.pause();
  }
  
  // Stopwatch methods
  toggleStopwatch() {
    if (this.isStopwatchRunning()) {
      this.isStopwatchRunning.set(false);
      clearInterval(this.stopwatchInterval);
    } else {
      this.isStopwatchRunning.set(true);
      const startTime = Date.now() - this.stopwatchTime();
      this.stopwatchInterval = setInterval(() => {
        this.stopwatchTime.set(Date.now() - startTime);
      }, 10);
    }
  }

  resetStopwatch() {
    this.stopwatchTime.set(0);
    if (!this.isStopwatchRunning()) return;
    this.isStopwatchRunning.set(false);
    clearInterval(this.stopwatchInterval);
  }

  // Timer methods
  setTimer() {
    const totalSeconds = this.timerInputHours() * 3600 + this.timerInputMinutes() * 60 + this.timerInputSeconds();
    this.timerTime.set(totalSeconds);
  }

  toggleTimer() {
    if (this.isTimerRunning()) {
      this.isTimerRunning.set(false);
      clearInterval(this.timerInterval);
    } else {
      if(this.timerTime() <= 0) this.setTimer();
      if(this.timerTime() <= 0) return;

      this.isTimerRunning.set(true);
      const endTime = Date.now() + this.timerTime() * 1000;
      this.timerInterval = setInterval(() => {
        const remaining = Math.round((endTime - Date.now()) / 1000);
        if (remaining >= 0) {
          this.timerTime.set(remaining);
        } else {
          this.timerTime.set(0);
          this.isTimerRunning.set(false);
          clearInterval(this.timerInterval);
          this.timerAudio.play();
        }
      }, 1000);
    }
  }

  resetTimer() {
    this.isTimerRunning.set(false);
    clearInterval(this.timerInterval);
    this.setTimer();
    this.timerAudio.pause();
    this.timerAudio.currentTime = 0;
  }
}
