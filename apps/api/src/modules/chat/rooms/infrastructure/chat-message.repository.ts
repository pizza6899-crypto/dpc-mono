import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ChatMessageRepositoryPort } from '../ports/chat-message.repository.port';
import { ChatMessage } from '../domain/chat-message.entity';
import { ChatMessageMapper } from './chat-message.mapper';

@Injectable()
export class ChatMessageRepository implements ChatMessageRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async save(message: ChatMessage): Promise<ChatMessage> {
        const saved = await this.tx.chatMessage.create({
            data: {
                id: message.id,
                roomId: message.roomId,
                content: message.content,
                type: message.type,
                senderId: message.senderId,

                metadata: message.metadata ?? undefined,
                isPinned: message.isPinned,
                isDeleted: message.isDeleted,
                createdAt: message.createdAt,
            },
        });

        return ChatMessageMapper.toDomain(saved);
    }

    async findByRoomId(roomId: bigint, limit = 50, lastMessageId?: bigint): Promise<ChatMessage[]> {
        const messages = await this.tx.chatMessage.findMany({
            where: {
                roomId,
                ...(lastMessageId ? { id: { lt: lastMessageId } } : {}),
            },
            orderBy: { id: 'desc' },
            take: limit,
        });

        return messages.map(ChatMessageMapper.toDomain);
    }
}


