import type {
  NOTIFICATION_EVENTS,
  REALTIME_EVENTS,
} from '../constants/event.constants';

// --- 입출금 ---
// --- 입금 ---
export interface BaseDepositPayload {
  id?: string;           // 내부 입금 신청 ID (어드민 상세 페이지 링크용)
  userId: string;
  amount: string;
  currency: string;
  email?: string;
  nickname?: string;
  requestedAt?: string;
  completedAt?: string;
  txId?: string;         // 완료 시 트랜잭션 해시 등
  reason?: string;       // 거절 사유
}

export interface FiatDepositPayload extends BaseDepositPayload {
  depositorName: string;
}

export interface CryptoDepositPayload extends BaseDepositPayload {
  address?: string;
  network?: string;
}

// --- 출금 ---
export interface BaseWithdrawalPayload {
  id?: string;
  userId: string;
  amount: string;
  currency: string;
  email?: string;
  nickname?: string;
  requestedAt?: string;
  completedAt?: string;
  txId?: string;
  reason?: string;
}

export interface FiatWithdrawalPayload extends BaseWithdrawalPayload {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface CryptoWithdrawalPayload extends BaseWithdrawalPayload {
  address: string;
  network: string;
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
  // 입금
  [NOTIFICATION_EVENTS.FIAT_DEPOSIT_REQUESTED]: FiatDepositPayload;
  [NOTIFICATION_EVENTS.FIAT_DEPOSIT_COMPLETED]: FiatDepositPayload;
  [NOTIFICATION_EVENTS.FIAT_DEPOSIT_REJECTED]: FiatDepositPayload;
  [NOTIFICATION_EVENTS.CRYPTO_DEPOSIT_REQUESTED]: CryptoDepositPayload;
  [NOTIFICATION_EVENTS.CRYPTO_DEPOSIT_COMPLETED]: CryptoDepositPayload;
  [NOTIFICATION_EVENTS.CRYPTO_DEPOSIT_REJECTED]: CryptoDepositPayload;

  // 출금
  [NOTIFICATION_EVENTS.FIAT_WITHDRAWAL_REQUESTED]: FiatWithdrawalPayload;
  [NOTIFICATION_EVENTS.FIAT_WITHDRAWAL_COMPLETED]: FiatWithdrawalPayload;
  [NOTIFICATION_EVENTS.FIAT_WITHDRAWAL_REJECTED]: FiatWithdrawalPayload;
  [NOTIFICATION_EVENTS.CRYPTO_WITHDRAWAL_REQUESTED]: CryptoWithdrawalPayload;
  [NOTIFICATION_EVENTS.CRYPTO_WITHDRAWAL_COMPLETED]: CryptoWithdrawalPayload;
  [NOTIFICATION_EVENTS.CRYPTO_WITHDRAWAL_REJECTED]: CryptoWithdrawalPayload;

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
  [REALTIME_EVENTS.ADMIN_FIAT_DEPOSIT_REQUESTED]: FiatDepositPayload;
  [REALTIME_EVENTS.ADMIN_CRYPTO_DEPOSIT_REQUESTED]: CryptoDepositPayload;

  // 기본 타입
  [key: string]: any;
};
