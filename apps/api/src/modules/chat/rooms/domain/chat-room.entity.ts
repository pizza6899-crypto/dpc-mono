import { type Prisma, ChatRoomType, SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';

export interface SupportInquiryInfo {
    status: SupportStatus;
    priority: SupportPriority;
    category: SupportCategory | null;
    subject: string | null;
    adminId: bigint | null;
}

export type ChatRoomRawPayload = Prisma.ChatRoomGetPayload<object>;

export class ChatRoom {
    constructor(
        public readonly id: bigint,
        public readonly type: ChatRoomType,
        public readonly isActive: boolean,
        public readonly metadata: Prisma.JsonValue,
        public readonly slowModeSeconds: number,
        public readonly minTierLevel: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly lastMessageAt: Date | null,
        public readonly supportInfo: SupportInquiryInfo | null,
    ) { }
}
