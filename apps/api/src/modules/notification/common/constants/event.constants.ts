// apps/api/src/modules/notification/common/constants/event.constants.ts

/**
 * 알림 이벤트 상수
 * Alert.event 필드에 사용되는 이벤트 키
 */
export const NOTIFICATION_EVENTS = {
    // 입출금
    DEPOSIT_COMPLETED: 'DEPOSIT_COMPLETED',
    DEPOSIT_REJECTED: 'DEPOSIT_REJECTED',
    WITHDRAWAL_COMPLETED: 'WITHDRAWAL_COMPLETED',
    WITHDRAWAL_REJECTED: 'WITHDRAWAL_REJECTED',

    // 프로모션
    PROMOTION_APPLIED: 'PROMOTION_APPLIED',
    PROMOTION_EXPIRED: 'PROMOTION_EXPIRED',

    // 시스템
    SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
    MAINTENANCE_NOTICE: 'MAINTENANCE_NOTICE',
} as const;

export type NotificationEventType =
    (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];
