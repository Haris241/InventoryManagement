import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DataLayerService } from './data-layer.service';
import { GetUserNotifications, NotificationEnvelope } from '../Models/Notification.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private dataService = inject(DataLayerService);
  private readonly destroyRef = inject(DestroyRef);
  notifications = signal<GetUserNotifications[]>([]);
  // Job completion events — components subscribe to specific jobIds
  private readonly jobCompleted$ = new Subject<NotificationEnvelope>();

  // Notification sound — debounce timer prevents stacking on rapid bursts
  private readonly notifAudio = new Audio('/NotificationSound.mp3');
  private soundLocked = signal<boolean>(false);

  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

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

  // Called by SignalR service when push arrives
  handleIncoming(envelope: NotificationEnvelope): void {
    // Add to top of list as unread (if it was persisted on backend)
    if (envelope.persist) {
      const newNotif: GetUserNotifications = {
        id: envelope.notificationId,
        title: envelope.title,
        message: envelope.message,
        type: envelope.type,
        status: envelope.status,
        isRead: false,
        createdAtUtc: new Date(envelope.timestamp)
      };
      this.notifications.update(current => {

        const exists = current.some(
          x => x.id === envelope.notificationId
        );

        if (exists) return current;

        return [newNotif, ...current];
      });
    }

    // Play sound — debounced so a burst of notifications rings once per 300 ms
    this.playNotificationSound();

    // Emit job completion so any subscriber can react
    this.jobCompleted$.next(envelope);
  }

  // Subscribe to a specific job's result
  onJobComplete(jobId: string, callback: (envelope: NotificationEnvelope) => void) {
    return this.jobCompleted$.subscribe(envelope => {
      if (envelope.jobId === jobId) callback(envelope);
    });
  }

  private playNotificationSound(): void {
    if (this.soundLocked())
      return;
    this.soundLocked.set(true);
    this.notifAudio.currentTime = 0;
    this.notifAudio.play().catch(() => { })
    setTimeout(() => {
      this.soundLocked.set(false);
    }, 300);
  }
}
