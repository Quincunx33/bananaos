import { Injectable, Type } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppRegistryService {
  private componentRegistry = new Map<string, Type<any>>();

  register(appId: string, component: Type<any>) {
    this.componentRegistry.set(appId, component);
  }

  get(appId: string): Type<any> | undefined {
    return this.componentRegistry.get(appId);
  }
}
