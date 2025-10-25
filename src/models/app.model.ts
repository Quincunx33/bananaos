import { Type } from '@angular/core';

export interface AppConfig {
  id: string;
  title: string;
  icon: string;
  component: Type<any>;
  description?: string;
  category?: 'System' | 'Productivity' | 'Games' | 'Creative' | 'Social' | 'Utilities' | 'Other';
  isCore?: boolean;
  defaultSize?: { width: number, height: number };
}
