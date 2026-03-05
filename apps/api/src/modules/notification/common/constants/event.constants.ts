// apps/api/src/modules/notification/common/constants/event.constants.ts

/**
 * 알림 이벤트 상수
 * Alert.event 필드에 사용되는 이벤트 키
 */
export const NOTIFICATION_EVENTS = {
  // 입금
  FIAT_DEPOSIT_REQUESTED: 'FIAT_DEPOSIT_REQUESTED',

  // 프로모션
  PROMOTION_APPLIED: 'PROMOTION_APPLIED',

  // 시스템
  PHONE_VERIFICATION_CODE: 'PHONE_VERIFICATION_CODE',
} as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];
