import type { NOTIFICATION_EVENTS } from '../constants/event.constants';
import { ExchangeCurrencyCode } from '@prisma/client';

/**
 * 입금 처리 완료/거절 시 (유저 알림용)
 */
export interface FiatDepositProcessedPayload {
  id?: string;
  userId: string;
  amount: string;
  currency: ExchangeCurrencyCode;
  completedAt?: string; // 처리 완료 일시
  txId?: string; // 트랜잭션 ID (성공 시)
  reason?: string; // 거절 사유 (실패 시)
  nickname?: string;
}

// --- 유저 ---
export interface UserRegisteredPayload {}

// --- 프로모션 ---
export interface PromotionPayload {
  promotionName: string;
  bonusAmount?: string;
  currency?: ExchangeCurrencyCode;
  expiryDate?: string;
}

// --- 시스템 ---
export interface VerificationPayload {
  code: string;
  target?: string;
}

export interface InboxNewPayload {
  id: string; // NotificationLog ID
  createdAt: string; // 생성 일시
  title: string | null; // 알림 제목
  body: string | null; // 알림 본문
  actionUri: string | null; // 클릭 시 이동할 링크
  metadata: Record<string, unknown> | null;
}

export interface SupportInquiryReceivedPayload {
  roomId: string; // Room ID
  userNickname: string; // 유저 닉네임
  content: string; // 메시지 내용
  category?: string; // 상담 카테고리 (있을 경우)
}

/**
 * 이벤트별 페이로드 매핑
 * 새로운 이벤트 추가 시 여기에 타입을 매핑해야 합니다.
 */
export type NotificationPayloadMap = {
  // 알림함
  [NOTIFICATION_EVENTS.INBOX_NEW]: InboxNewPayload;

  // 프로모션
  [NOTIFICATION_EVENTS.PROMOTION_APPLIED]: PromotionPayload;

  // 유저
  [NOTIFICATION_EVENTS.USER_REGISTERED]: UserRegisteredPayload;

  // 시스템
  [NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE]: VerificationPayload;

  // 고객센터 (Admin 알림)
  [NOTIFICATION_EVENTS.SUPPORT_INQUIRY_RECEIVED]: SupportInquiryReceivedPayload;
};
