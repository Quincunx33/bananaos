import { ChangeDetectionStrategy, Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent implements OnDestroy {
  notificationService = inject(NotificationService);
  
  // This will only ever contain 0 or 1 toast to meet the user's request
  visibleToasts = signal<Notification[]>([]);
  
  private notificationQueue = signal<Notification[]>([]);
  private processedIds = new Set<number>();
  private activeTimeout: any = null;

  constructor() {
    effect(() => {
        const allNotifications = this.notificationService.notifications();
        const newNotifications = allNotifications.filter(n => !this.processedIds.has(n.id));

        if (newNotifications.length > 0) {
            // Add new notifications to the queue, oldest first if multiple arrive at once
            this.notificationQueue.update(queue => [...queue, ...newNotifications.reverse()]); 
            newNotifications.forEach(n => this.processedIds.add(n.id));
            
            // Attempt to display the next notification
            this.processQueue();
        }
    });
  }
  
  ngOnDestroy() {
    // Clear any pending timeout when the component is destroyed
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
    }
  }

  private processQueue() {
    // A toast is already visible, or the queue is empty. Wait.
    if (this.visibleToasts().length > 0 || this.notificationQueue().length === 0) {
      return;
    }

    // Get the next notification from the queue
    let nextNotification: Notification | undefined;
    this.notificationQueue.update(queue => {
      nextNotification = queue[0];
      return queue.slice(1);
    });

    if (nextNotification) {
      // Display the toast
      this.visibleToasts.set([nextNotification]);

      // Set a timer to hide it automatically and process the next one
      this.activeTimeout = setTimeout(() => {
        this.visibleToasts.set([]);
        this.activeTimeout = null;
        this.processQueue();
      }, 5000);
    }
  }

  // This method is called when the user manually clicks the 'x' button on a toast
  removeToast(id: number) {
      const currentToast = this.visibleToasts()[0];
      // Only act if the toast being removed is the one currently visible
      if (currentToast && currentToast.id === id) {
          // Clear the automatic removal timeout
          if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
            this.activeTimeout = null;
          }
          
          // Remove the toast from view
          this.visibleToasts.set([]);
          
          // Immediately try to show the next notification in the queue
          this.processQueue();
      }
  }
}
