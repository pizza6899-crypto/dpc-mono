// apps/api/src/modules/notification/common/constants/target-group.constants.ts

/**
 * 알림 타겟 그룹 상수
 * Alert.targetGroup 필드에 사용되는 값
 */
export const NOTIFICATION_TARGET_GROUPS = {
  ALL: 'ALL',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type NotificationTargetGroupType =
  (typeof NOTIFICATION_TARGET_GROUPS)[keyof typeof NOTIFICATION_TARGET_GROUPS];
