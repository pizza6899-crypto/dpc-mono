import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ChatRoomMember } from '../domain/chat-room-member.entity';
import { type ChatRoomMemberRepositoryPort } from '../ports/chat-room-member.repository.port';
import { ChatRoomMemberMapper } from './chat-room-member.mapper';

@Injectable()
export class ChatRoomMemberRepository implements ChatRoomMemberRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findByRoomIdAndUserId(roomId: bigint, userId: bigint): Promise<ChatRoomMember | null> {
        const record = await this.tx.chatRoomMember.findUnique({
            where: {
                roomId_userId: {
                    roomId,
                    userId,
                },
            },
        });

        return record ? ChatRoomMemberMapper.toDomain(record) : null;
    }

    async listByUserId(userId: bigint): Promise<ChatRoomMember[]> {
        const records = await this.tx.chatRoomMember.findMany({
            where: { userId },
        });

        return records.map((record) => ChatRoomMemberMapper.toDomain(record));
    }

    async save(member: ChatRoomMember): Promise<ChatRoomMember> {
        const record = await this.tx.chatRoomMember.upsert({
            where: {
                roomId_userId: {
                    roomId: member.roomId,
                    userId: member.userId,
                },
            },
            update: {
                role: member.role,
                lastReadAt: member.lastReadAt,
            },
            create: {
                roomId: member.roomId,
                userId: member.userId,
                role: member.role,
                lastReadAt: member.lastReadAt,
            },
        });

        return ChatRoomMemberMapper.toDomain(record);
    }

    async delete(roomId: bigint, userId: bigint): Promise<void> {
        await this.tx.chatRoomMember.delete({
            where: {
                roomId_userId: {
                    roomId,
                    userId,
                },
            },
        });
    }
}
