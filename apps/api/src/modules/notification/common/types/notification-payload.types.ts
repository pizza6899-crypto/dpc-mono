import type {
  NOTIFICATION_EVENTS,
  REALTIME_EVENTS,
} from '../constants/event.constants';

// --- 입출금 ---
export interface DepositPayload {
  amount: string;
  currency: string;
  txId: string;
  completedAt: string;
}

export interface WithdrawalPayload {
  amount: string;
  currency: string;
  txId: string;
  reason?: string; // 거절 사유 등
}

// --- 프로모션 ---
export interface PromotionPayload {
  promotionName: string;
  bonusAmount?: string;
  currency?: string;
  expiryDate?: string;
}

// --- 유저 ---
export interface UserRegisteredPayload {
  email: string;
  registeredAt: string;
}

// --- 시스템 ---
export interface SystemPayload {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface VerificationPayload {
  code: string;
  target?: string;
}

// --- 실시간 유저 상태 ---
export interface BalanceUpdatedPayload {
  balance: string;
  currency: string;
  prevBalance?: string;
  reason?: string;
}

export interface LevelUpdatedPayload {
  level: number;
  levelName: string;
}

// --- 실시간 시스템 ---
export interface AlertPopupPayload {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

/**
 * 이벤트별 페이로드 매핑
 * 새로운 이벤트 추가 시 여기에 타입을 매핑해야 합니다.
 */
export type NotificationPayloadMap = {
  // 입출금
  [NOTIFICATION_EVENTS.DEPOSIT_COMPLETED]: DepositPayload;
  [NOTIFICATION_EVENTS.DEPOSIT_REJECTED]: DepositPayload;
  [NOTIFICATION_EVENTS.WITHDRAWAL_COMPLETED]: WithdrawalPayload;
  [NOTIFICATION_EVENTS.WITHDRAWAL_REJECTED]: WithdrawalPayload;

  // 프로모션
  [NOTIFICATION_EVENTS.PROMOTION_APPLIED]: PromotionPayload;
  [NOTIFICATION_EVENTS.PROMOTION_EXPIRED]: PromotionPayload;

  // 유저
  [NOTIFICATION_EVENTS.USER_REGISTERED]: UserRegisteredPayload;

  // 시스템
  [NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT]: SystemPayload;
  [NOTIFICATION_EVENTS.MAINTENANCE_NOTICE]: SystemPayload;
  [NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE]: VerificationPayload;

  // 기본 타입 (정의되지 않은 이벤트용)
  [key: string]: any;
};

/**
 * 실시간(휘발성) 이벤트별 페이로드 매핑
 */
export type RealtimePayloadMap = {
  [REALTIME_EVENTS.BALANCE_UPDATED]: BalanceUpdatedPayload;
  [REALTIME_EVENTS.LEVEL_UPDATED]: LevelUpdatedPayload;
  [REALTIME_EVENTS.ALERT_POPUP]: AlertPopupPayload;

  // 기본 타입
  [key: string]: any;
};
