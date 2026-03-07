import { type Prisma, ChatMemberRole } from '@prisma/client';

export type ChatRoomMemberRawPayload = Prisma.ChatRoomMemberGetPayload<object>;

export class ChatRoomMember {
    constructor(
        public readonly id: bigint,
        public readonly roomId: bigint,
        public readonly userId: bigint,
        public readonly role: ChatMemberRole,
        public readonly lastReadAt: Date | null,
        public readonly createdAt: Date,
    ) { }
}
