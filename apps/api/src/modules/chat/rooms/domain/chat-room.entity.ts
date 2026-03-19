import {
  type Prisma,
  ChatRoomType,
  SupportStatus,
  SupportPriority,
  SupportCategory,
  Language,
} from '@prisma/client';

/**
 * 채팅방 다국어 번역 정보
 */
export interface ChatRoomTranslation {
  /** 채팅방 명칭 */
  name: string;
  /** 채팅방 설명 */
  description?: string | null;
}

/**
 * 채팅방 메타데이터 (JSONB)
 */
export interface ChatRoomMetadata {
  /**
   * 다국어 번역 데이터
   * @example { "KO": { "name": "글로벌" }, "EN": { "name": "Global" } }
   */
  translations?: Partial<Record<Language, ChatRoomTranslation>>;
  /** 글로벌 채팅방 여부 */
  isGlobal?: boolean;
  /** 특정 기준 언어 코드 (필터링용) */
  language?: string;
}

export interface SupportInquiryInfo {
  status: SupportStatus;
  priority: SupportPriority;
  category: SupportCategory | null;
  subject: string | null;
  adminId: bigint | null;
  adminLastReadId: bigint | null;
}

export type ChatRoomRawPayload = Prisma.ChatRoomGetPayload<object>;

export class ChatRoom {
  constructor(
    public readonly id: bigint,
    public readonly type: ChatRoomType,
    public readonly isActive: boolean,
    public readonly metadata: ChatRoomMetadata,
    public readonly slowModeSeconds: number,
    public readonly minTierLevel: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastMessageAt: Date | null,
    public readonly supportInfo: SupportInquiryInfo | null,
  ) {}
}
