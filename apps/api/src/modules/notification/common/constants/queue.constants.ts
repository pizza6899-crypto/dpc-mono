// apps/api/src/modules/notification/common/constants/queue.constants.ts

export const NOTIFICATION_QUEUES = {
    ALERT: 'notification-alert',
    SOCKET: 'notification-socket',
    EMAIL: 'notification-email',
    SMS: 'notification-sms',
} as const;

export type NotificationQueueName =
    (typeof NOTIFICATION_QUEUES)[keyof typeof NOTIFICATION_QUEUES];
