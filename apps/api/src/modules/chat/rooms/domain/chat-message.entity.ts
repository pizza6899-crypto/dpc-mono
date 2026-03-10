import { type Prisma, ChatMessageType } from '@prisma/client';

export interface ChatMessageMetadata {
    /** 첨부 파일 목록 (이미지, 영상, 일반 파일 등) */
    attachments?: ChatMessageAttachment[];

    /** 메시지에 포함된 멘션 대상 SQIDs */
    mentions?: string[];

    /** 답장 대상 메시지 SQID */
    replyToMessageId?: string;
}

export interface ChatMessageAttachment {
    fileId: string;
    /** 클라이언트 전송용 실시간 접근 URL (CDN 또는 Presigned URL) */
    url?: string;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
    width?: number | null;
    height?: number | null;
    duration?: number | null; // 영상/음성 재생 시간 (초)
    thumbnailFileId?: string; // 영상 전용 썸네일
}

export type ChatMessageRawPayload = Prisma.ChatMessageGetPayload<object>;

export class ChatMessage {
    constructor(
        public readonly id: bigint,
        public readonly roomId: bigint,
        public readonly content: string,
        public readonly type: ChatMessageType,
        public readonly senderId: bigint | null,
        public readonly metadata: ChatMessageMetadata | null,
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
        metadata?: ChatMessageMetadata | null;
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

    updateContent(content: string): ChatMessage {
        return new ChatMessage(
            this.id,
            this.roomId,
            content,
            this.type,
            this.senderId,
            this.metadata,
            this.isPinned,
            this.isDeleted,
            this.createdAt,
        );
    }

    delete(): ChatMessage {
        return new ChatMessage(
            this.id,
            this.roomId,
            this.content,
            this.type,
            this.senderId,
            this.metadata,
            this.isPinned,
            true, // isDeleted
            this.createdAt,
        );
    }
}
