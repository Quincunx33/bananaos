
import { Injectable, signal } from '@angular/core';
import { AppWindow } from '../models/window.model';

@Injectable({ providedIn: 'root' })
export class DesktopStateService {
  // A readonly view of the open windows for other parts of the OS to consume.
  openWindows = signal<Readonly<AppWindow[]>>([]);
}
