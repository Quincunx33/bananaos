import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface CopilotAction {
  action: string;
  [key: string]: any;
}

export interface InAppAction {
    appId: string;
    action: string;
    payload: { [key: string]: any };
}

export interface CodeRepairPayload {
  filePath: string;
  codePatch: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class OsInteractionService {
  // Subject to request opening an app
  openAppRequest = new Subject<{ appId: string, data?: any }>();
  
  // Subject to update a window's title
  updateWindowTitle = new Subject<{ windowId: string, newTitle: string }>();

  // Subject to request a factory reset
  factoryResetRequest = new Subject<void>();

  // Subject to request a system restart
  restartRequest = new Subject<void>();

  // Subject for AI Copilot OS-level commands
  copilotActionRequest = new Subject<CopilotAction>();

  // Subject for AI Copilot in-app commands
  inAppActionRequest = new Subject<InAppAction>();

  // Subject for AI Copilot to request code repairs
  codeRepairRequest = new Subject<CodeRepairPayload>();
}