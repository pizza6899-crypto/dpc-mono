/**
 * 소켓 전송 규격 (Socket Payload Contract)
 *
 * 이 파일은 WebSocket을 통해 프론트엔드로 전송되는 모든 이벤트의
 * 타입(type)과 페이로드(payload) 형태를 정의합니다.
 *
 * 새로운 소켓 이벤트를 추가할 때:
 * 1. SOCKET_EVENT_TYPES에 이벤트 상수를 추가합니다.
 * 2. 해당 이벤트의 페이로드 인터페이스를 정의합니다.
 * 3. SocketPayloadMap에 매핑을 추가합니다.
 */

// ============================================
// 이벤트 타입 상수 (유저/어드민 분리)
// ============================================

/** 일반 사용자 대상 이벤트 */
export const USER_SOCKET_EVENT_TYPES = {
    /** 새 받은편지함 알림 도착 */
    INBOX_NEW: 'INBOX_NEW',
    /** 프로모션 적용 결과 */
    PROMOTION_APPLIED: 'PROMOTION_APPLIED',
    /** 새 채팅 메시지 도착 */
    CHAT_MESSAGE_NEW: 'CHAT_MESSAGE_NEW',
    /** 채팅 메시지 읽음 처리 알림 */
    CHAT_MESSAGES_READ: 'CHAT_MESSAGES_READ',
} as const;

/** 관리자 전용 이벤트 */
export const ADMIN_SOCKET_EVENT_TYPES = {
    /** 입금 요청 접수 (관리자 알림) */
    FIAT_DEPOSIT_REQUESTED: 'FIAT_DEPOSIT_REQUESTED',
    /** 출금 요청 접수 (관리자 알림) */
    WITHDRAW_REQUESTED: 'WITHDRAW_REQUESTED',
    /** 상담 문의 접수 (관리자 알림) */
    SUPPORT_INQUIRY_RECEIVED: 'SUPPORT_INQUIRY_RECEIVED',
} as const;

/** 공통/시스템 이벤트 */
export const COMMON_SOCKET_EVENT_TYPES = {
    /** 시스템 전체 공지 */
    SYSTEM_NOTICE: 'SYSTEM_NOTICE',
} as const;

/** 통합 소켓 이벤트 타입 전역 상수 */
export const SOCKET_EVENT_TYPES = {
    ...USER_SOCKET_EVENT_TYPES,
    ...ADMIN_SOCKET_EVENT_TYPES,
    ...COMMON_SOCKET_EVENT_TYPES,
} as const;

export type SocketEventType =
    (typeof SOCKET_EVENT_TYPES)[keyof typeof SOCKET_EVENT_TYPES];

// ============================================
// 페이로드 인터페이스
// ============================================

export interface SocketInboxNewPayload {
    id: string;                 // Sqiddified ID
    event: string | null;       // 템플릿 이벤트 명 (예: FIAT_DEPOSIT_COMPLETED)
    createdAt: string;
    title: string | null;
    body: string | null;
    actionUri: string | null;
    isRead: boolean;            // 항상 false (새 알림이므로)
    readAt: string | null;      // 항상 null
    metadata: Record<string, any> | null;
}

/** 
 * 관리자 실시간 알림 공용 페이로드
 * (진행 중인 이벤트에 대한 최소 정보만 포함하여 Sound/Toast용으로 사용)
 */
/** 
 * FIAT_DEPOSIT_REQUESTED: 입금 요청 실시간 알림 페이로드
 */
export interface SocketFiatDepositRequestedPayload {
    id: string;              // 입금 신청 ID
    depositorName: string;
    amount: string;
    currency: string;
    requestedAt: string;
}

/** 
 * WITHDRAW_REQUESTED: 출금 요청 실시간 알림 페이로드
 */
export interface SocketWithdrawRequestedPayload {
    id: string;              // 출금 신청 ID
    userId: string;
    amount: string;
    currency: string;
    requestedAt: string;
}

/** 
 * SUPPORT_INQUIRY_RECEIVED: 상담 문의 접수 실시간 알림 페이로드
 */
export interface SocketSupportInquiryReceivedPayload {
    roomId: string;          // Encoded Support Room ID
    userId: string;          // Encoded User ID
    userNickname: string;
    content: string;         // 첫 메시지 내용
    requestedAt: string;
}

/** PROMOTION_APPLIED: 프로모션 적용 시 유저에게 전달되는 데이터 */
export interface SocketPromotionAppliedPayload {
    alertId?: string;
    promotionName: string;
    bonusAmount?: string;
    currency?: string;
    expiryDate?: string;
}

/** SYSTEM_NOTICE: 시스템 공지사항 (전체 대상) */
export interface SocketSystemNoticePayload {
    title: string;
    body: string;
}

/** CHAT_MESSAGE_NEW: 새 채팅 메시지 실시간 스트림 페이로드 */
export interface SocketChatMessageNewPayload {
    id: string;              // Encoded Message ID
    roomId: string;          // Encoded Room ID
    senderId: string | null; // Encoded Sender ID (null일 경우 시스템 메시지)
    content: string;
    type: string;            // ChatMessageType (TEXT, IMAGE, etc)
    metadata: any | null;
    createdAt: string;       // ISO format
}

/** CHAT_MESSAGES_READ: 채팅 메시지 읽음 처리 실시간 알림 페이로드 */
export interface SocketChatMessagesReadPayload {
    roomId: string;          // Encoded Room ID
    userId: string;          // Encoded User ID (누가 읽었는지)
    lastReadMessageId: string; // Encoded Message ID (어디까지 읽었는지)
}

// ============================================
// 이벤트 → 페이로드 매핑 (Single Source of Truth)
// ============================================

/**
 * 소켓 이벤트별 페이로드 매핑 테이블
 *
 * WebsocketService.sendToUser / sendToRoom 호출 시
 * 이 맵을 기반으로 type과 payload의 타입이 자동 추론됩니다.
 *
 * @example
 * // ✅ 타입 자동 추론 — payload에 SocketInboxNewPayload를 강제
 * websocketService.sendToUser(userId, SOCKET_EVENT_TYPES.INBOX_NEW, { id: '...', ... });
 *
 * // ❌ 컴파일 에러 — 잘못된 payload 형태
 * websocketService.sendToUser(userId, SOCKET_EVENT_TYPES.INBOX_NEW, { wrongField: true });
 */
export type SocketPayloadMap = {
    [SOCKET_EVENT_TYPES.INBOX_NEW]: SocketInboxNewPayload;
    [SOCKET_EVENT_TYPES.FIAT_DEPOSIT_REQUESTED]: SocketFiatDepositRequestedPayload;
    [SOCKET_EVENT_TYPES.WITHDRAW_REQUESTED]: SocketWithdrawRequestedPayload;
    [SOCKET_EVENT_TYPES.PROMOTION_APPLIED]: SocketPromotionAppliedPayload;
    [SOCKET_EVENT_TYPES.SYSTEM_NOTICE]: SocketSystemNoticePayload;
    [SOCKET_EVENT_TYPES.CHAT_MESSAGE_NEW]: SocketChatMessageNewPayload;
    [SOCKET_EVENT_TYPES.CHAT_MESSAGES_READ]: SocketChatMessagesReadPayload;
    [SOCKET_EVENT_TYPES.SUPPORT_INQUIRY_RECEIVED]: SocketSupportInquiryReceivedPayload;
};
