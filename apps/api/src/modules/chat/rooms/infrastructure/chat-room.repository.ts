import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ChatRoom } from '../domain/chat-room.entity';
import { type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { ChatRoomMapper } from './chat-room.mapper';
import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';

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

    async listSupportRooms(filters: {
        status?: SupportStatus;
        priority?: SupportPriority;
        category?: SupportCategory;
        adminId?: bigint;
    }): Promise<ChatRoom[]> {
        const records = await this.tx.chatRoom.findMany({
            where: {
                type: 'SUPPORT',
                supportStatus: filters.status,
                supportPriority: filters.priority,
                supportCategory: filters.category,
                supportAdminId: filters.adminId,
            },
            orderBy: { updatedAt: 'desc' },
        });

        return records.map((record) => ChatRoomMapper.toDomain(record));
    }


    async findActiveSupportRoomByUserId(userId: bigint): Promise<ChatRoom | null> {
        const record = await this.tx.chatRoom.findFirst({
            where: {
                type: 'SUPPORT',
                supportStatus: { not: 'CLOSED' },
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
            supportStatus: room.supportStatus,
            supportPriority: room.supportPriority,
            supportCategory: room.supportCategory,
            supportSubject: room.supportSubject,
            supportAdminId: room.supportAdminId,
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
}
