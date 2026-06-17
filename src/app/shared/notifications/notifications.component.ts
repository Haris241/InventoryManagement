import { Component, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationType } from '../../Models/Notification.model';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
  protected readonly notifState = inject(NotificationService);
  private router = inject(Router);
  confirmation = inject(ConfirmationService);

  /** Output: emits when panel close is requested */
  close = output<void>();

  /** Sorted notifications: unread first, then read */
  sortedNotifications = computed(() => {
    const all = this.notifState.notifications();
    const unread = all.filter(n => !n.isRead);
    const read = all.filter(n => n.isRead);
    return [...unread, ...read];
  });

  /** Close the notification panel */
  onClose(): void {
    this.close.emit();
  }

  //Mark All As Read
  onMarkAllAsRead(): void {
    this.notifState.markAllAsRead();
  }

  //Delete Single Notification
  onDelete(id: string): void {
    this.notifState.deleteNotification(id);
  }

  /** Delete all notifications */
  onDeleteAll(): void {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete all?',
      header: 'Delete All Notifications',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.notifState.deleteAllNotifications();
      },
      reject: () => {
        // Optional: handle rejection
      }

    });
  }

  /** Navigate to the notification link */
  onNavigate(link: string): void {
    this.onClose();
    this.router.navigateByUrl(link);
  }

  /** Get icon name based on notification type */
  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success: return 'check_circle';
      case NotificationType.Error: return 'error';
      case NotificationType.Warning: return 'warning';
      case NotificationType.Info: return 'info';
      default: return 'notifications';
    }
  }

  /** Get CSS class for notification type color */
  getTypeClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success: return 'type-success';
      case NotificationType.Error: return 'type-error';
      case NotificationType.Warning: return 'type-warning';
      case NotificationType.Info: return 'type-info';
      default: return '';
    }
  }

  /** Get relative time string from date */
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
