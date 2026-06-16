import { inject, Injectable, signal } from '@angular/core';
import { DataLayerService } from './data-layer.service';
import { GetUserNotifications } from '../Models/Notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private dataService = inject(DataLayerService);
  notifications = signal<GetUserNotifications[]>([]);

  //Get All Notifications
  getUserNotifications(): void {
    this.dataService.getAllSimple<GetUserNotifications>('Notification/GetAll').subscribe({
      next: (data) => {
        this.notifications.set(data ?? []);
      }
    })
  }

  //Delete All Notifications
  deleteAllNotifications(): void {
    this.dataService.deleteAll<void>('Notification/DeleteAll').subscribe({
      next: () => {
        this.notifications.set([]);
      }
    })
  }

  //Mark All Notifications as Read
  markAllAsRead(): void {
    this.dataService.updateAll<void>('Notification/MarkAllAsRead').subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, isRead: true }))
        );
      }
    })
  }

  //Delete Notification by ID
  deleteNotification(id: string): void {
    this.dataService.delete<void>('Notification', id).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.filter(n => n.id !== id)
        );
      }
    })
  }
}
