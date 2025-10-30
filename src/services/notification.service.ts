import { Injectable, signal, computed, inject } from '@angular/core';
import { Notification, NewNotification } from '../models/notification.model';
import { AppManagementService } from './app-management.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private nextId = 0;
  private appManagementService = inject(AppManagementService);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  show(newNotif: NewNotification) {
    const appConfig = this.appManagementService.allApps().find(app => app.id === newNotif.appId);

    const newNotification: Notification = {
      id: this.nextId++,
      title: newNotif.title,
      body: newNotif.body,
      type: newNotif.type || 'info',
      appId: newNotif.appId,
      appIcon: appConfig?.icon || 'fas fa-info-circle',
      timestamp: Date.now(),
      isRead: false,
    };

    this.notifications.update(current => [newNotification, ...current]);
  }

  remove(id: number) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  markAllAsRead() {
    this.notifications.update(current => 
        current.map(n => n.isRead ? n : { ...n, isRead: true })
    );
  }

  clearAll() {
    this.notifications.set([]);
  }
}
