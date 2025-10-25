import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiKeyService } from './api-key.service';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);
  private apiKeyService = inject(ApiKeyService);
  private apiKey = signal<string | null>(null);
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor() {
    effect(() => {
      this.apiKey.set(this.apiKeyService.openWeatherApiKey());
    });
  }

  getWeatherByCity(city: string): Observable<any> {
    const key = this.apiKey();
    if (!key) {
      return throwError(() => new Error('OpenWeatherMap API key not configured.'));
    }
    return this.http.get(`${this.apiUrl}?q=${city}&appid=${key}&units=metric`);
  }

  getWeatherByCoords(lat: number, lon: number): Observable<any> {
    const key = this.apiKey();
    if (!key) {
      return throwError(() => new Error('OpenWeatherMap API key not configured.'));
    }
    return this.http.get(`${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${key}&units=metric`);
  }
}
