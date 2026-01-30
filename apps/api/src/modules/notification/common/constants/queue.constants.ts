// apps/api/src/modules/notification/common/constants/queue.constants.ts

import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';

export const NOTIFICATION_QUEUES = {
    ALERT: BULLMQ_QUEUES.NOTIFICATION.ALERT.name,
    SOCKET: BULLMQ_QUEUES.NOTIFICATION.SOCKET.name,
    EMAIL: BULLMQ_QUEUES.NOTIFICATION.EMAIL.name,
    SMS: BULLMQ_QUEUES.NOTIFICATION.SMS.name,
} as const;

export type NotificationQueueName =
    (typeof NOTIFICATION_QUEUES)[keyof typeof NOTIFICATION_QUEUES];
