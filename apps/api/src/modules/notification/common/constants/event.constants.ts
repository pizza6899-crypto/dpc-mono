// apps/api/src/modules/notification/common/constants/event.constants.ts

/**
 * 알림 이벤트 상수
 * Alert.event 필드에 사용되는 이벤트 키
 */
export const NOTIFICATION_EVENTS = {
  // 유저
  USER_REGISTERED: 'USER_REGISTERED',

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
  PHONE_VERIFICATION_CODE: 'PHONE_VERIFICATION_CODE',
} as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

/**
 * 실시간 가속 메시지용 이벤트 상수 (DB 저장 안 함)
 */
export const REALTIME_EVENTS = {
  // 유저 상태
  BALANCE_UPDATED: 'BALANCE_UPDATED',
  LEVEL_UPDATED: 'LEVEL_UPDATED',

  // 시스템
  ALERT_POPUP: 'ALERT_POPUP',
} as const;

export type RealtimeEventType =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
