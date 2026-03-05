import type {
  NOTIFICATION_EVENTS,
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

// --- 프로모션 ---
export interface PromotionPayload {
  promotionName: string;
  bonusAmount?: string;
  currency?: string;
  expiryDate?: string;
}

// --- 시스템 ---
export interface VerificationPayload {
  code: string;
  target?: string;
}

/**
 * 이벤트별 페이로드 매핑
 * 새로운 이벤트 추가 시 여기에 타입을 매핑해야 합니다.
 */
export type NotificationPayloadMap = {
  // 입금
  [NOTIFICATION_EVENTS.FIAT_DEPOSIT_REQUESTED]: FiatDepositPayload;

  // 프로모션
  [NOTIFICATION_EVENTS.PROMOTION_APPLIED]: PromotionPayload;

  // 시스템
  [NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE]: VerificationPayload;

};
