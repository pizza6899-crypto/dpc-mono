import { type Prisma, ChatRoomType, SupportStatus, SupportPriority } from '@prisma/client';

export type ChatRoomRawPayload = Prisma.ChatRoomGetPayload<object>;

export class ChatRoom {
    constructor(
        public readonly id: bigint,
        public readonly slug: string | null,
        public readonly type: ChatRoomType,
        public readonly isActive: boolean,
        public readonly metadata: Prisma.JsonValue,
        public readonly slowModeSeconds: number,
        public readonly minTierLevel: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly lastMessageAt: Date | null,
        // Support Specific Fields
        public readonly supportStatus: SupportStatus | null,
        public readonly supportPriority: SupportPriority | null,
        public readonly supportCategory: string | null,
        public readonly supportSubject: string | null,
        public readonly supportAdminId: bigint | null,
    ) { }
}

