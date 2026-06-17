export interface GetUserNotifications {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    status: NotificationStatus;
    isRead: boolean;
    link?: string;
    createdAtUtc: Date;
}
export enum NotificationType {
    Success = 1,
    Error = 2,
    Warning = 3,
    Info = 4
}
export enum NotificationStatus {
    Completed = 1,
    Failed = 2
}
export interface NotificationEnvelope {
    notificationId: string;
    jobId: string;
    type: NotificationType;
    status: NotificationStatus;
    title: string;
    message: string;
    payload?: any;
    timestamp: string;
    persist: boolean;
}