
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface IpifyResponse {
  ip: string;
}

interface GeolocationResponse {
  country: string;
  countryCode: string;
  query: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class IpService {
  private http = inject(HttpClient);

  getPublicIp(): Observable<string> {
    return this.http.get<IpifyResponse>('https://api.ipify.org?format=json').pipe(
      map(response => response.ip)
    );
  }

  getGeolocation(): Observable<GeolocationResponse> {
    return this.http.get<GeolocationResponse>('http://ip-api.com/json/');
  }
}
