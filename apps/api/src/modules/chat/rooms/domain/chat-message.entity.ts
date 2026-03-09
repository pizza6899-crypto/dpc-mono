import { type Prisma, ChatMessageType } from '@prisma/client';

export type ChatMessageRawPayload = Prisma.ChatMessageGetPayload<object>;

export class ChatMessage {
    constructor(
        public readonly id: bigint,
        public readonly roomId: bigint,
        public readonly content: string,
        public readonly type: ChatMessageType,
        public readonly senderId: bigint | null,
        public readonly metadata: Prisma.JsonValue | null,
        public readonly isPinned: boolean,
        public readonly isDeleted: boolean,
        public readonly createdAt: Date,
    ) { }


    static create(params: {
        id: bigint;
        roomId: bigint;
        content: string;
        type?: ChatMessageType;
        senderId?: bigint | null;
        metadata?: Prisma.JsonValue | null;
    }): ChatMessage {

        return new ChatMessage(
            params.id,
            params.roomId,
            params.content,
            params.type ?? ChatMessageType.TEXT,
            params.senderId ?? null,
            params.metadata ?? null,
            false,
            false,
            new Date(),
        );

    }
}
