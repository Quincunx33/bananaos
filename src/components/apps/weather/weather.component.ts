import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { WeatherService } from '../../../services/weather.service';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class WeatherComponent implements OnInit {
  private weatherService = inject(WeatherService);

  weather = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.getWeatherForCity('New York');
  }

  getWeatherForCity(city: string) {
    if (!city) return;
    this.loading.set(true);
    this.error.set(null);
    this.weatherService.getWeatherByCity(city).subscribe({
      next: data => {
        this.weather.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not fetch weather for that city.');
        this.loading.set(false);
      }
    });
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      this.loading.set(true);
      this.error.set(null);
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        this.weatherService.getWeatherByCoords(latitude, longitude).subscribe({
          next: data => {
            this.weather.set(data);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Could not fetch weather for your location.');
            this.loading.set(false);
          }
        });
      }, () => {
        this.error.set('Geolocation access denied.');
        this.loading.set(false);
      });
    } else {
      this.error.set('Geolocation is not supported by your browser.');
    }
  }

  onSearch(event: Event) {
    const city = (event.target as HTMLInputElement).value;
    this.getWeatherForCity(city);
  }
}