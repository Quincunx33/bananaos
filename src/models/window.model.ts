
import { Type, Injector } from '@angular/core';

export interface AppWindow {
  id: string;
  appId: string;
  title: string;
  icon: string;
  component: Type<any>;
  position: { x: number, y: number };
  size: { width: number, height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  state: 'default' | 'maximized' | 'minimized';
  previousState?: {
    position: { x: number, y: number };
    size: { width: number, height: number };
  };
  injector?: Injector;
}
