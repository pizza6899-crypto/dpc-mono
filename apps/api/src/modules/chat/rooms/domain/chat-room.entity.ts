import { type Prisma, ChatRoomType } from '@prisma/client';

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
    ) { }
}
