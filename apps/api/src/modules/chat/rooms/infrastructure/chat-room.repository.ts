import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ChatRoom } from '../domain/chat-room.entity';
import { type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { ChatRoomMapper } from './chat-room.mapper';

@Injectable()
export class ChatRoomRepository implements ChatRoomRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findById(id: bigint): Promise<ChatRoom | null> {
        const record = await this.tx.chatRoom.findUnique({
            where: { id },
        });

        return record ? ChatRoomMapper.toDomain(record) : null;
    }


    async listActiveRooms(): Promise<ChatRoom[]> {
        const records = await this.tx.chatRoom.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        return records.map((record) => ChatRoomMapper.toDomain(record));
    }


    async findSupportRoomByUserId(userId: bigint): Promise<ChatRoom | null> {
        const record = await this.tx.chatRoom.findFirst({
            where: {
                type: 'SUPPORT',
                members: { some: { userId } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return record ? ChatRoomMapper.toDomain(record) : null;
    }


    async save(room: ChatRoom): Promise<ChatRoom> {
        const data = {
            type: room.type,
            isActive: room.isActive,
            metadata: room.metadata as any,
            slowModeSeconds: room.slowModeSeconds,
            minTierLevel: room.minTierLevel,
            lastMessageAt: room.lastMessageAt,
            supportStatus: room.supportInfo?.status || null,
            supportPriority: room.supportInfo?.priority || null,
            supportCategory: room.supportInfo?.category || null,
            supportSubject: room.supportInfo?.subject || null,
            supportAdminId: room.supportInfo?.adminId || null,
        };


        let record;
        if (room.id === 0n) {
            record = await this.tx.chatRoom.create({
                data,
            });
        } else {
            record = await this.tx.chatRoom.upsert({
                where: { id: room.id },
                update: data,
                create: {
                    ...data,
                    id: room.id,
                },
            });
        }

        return ChatRoomMapper.toDomain(record);
    }

    async updateLastMessageAt(roomId: bigint, lastMessageAt: Date): Promise<void> {
        await this.tx.chatRoom.update({
            where: { id: roomId },
            data: {
                lastMessageAt,
                updatedAt: new Date(),
            },
        });
    }
}
