export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  appId: string;
  appIcon: string;
  timestamp: number;
  isRead: boolean;
}

// For creating new notifications
export interface NewNotification {
    title: string;
    body: string;
    appId: string;
    type?: NotificationType;
}
