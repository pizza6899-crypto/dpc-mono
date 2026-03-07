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

    async findBySlug(slug: string): Promise<ChatRoom | null> {
        const record = await this.tx.chatRoom.findUnique({
            where: { slug },
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

    async save(room: ChatRoom): Promise<ChatRoom> {
        const data = {
            slug: room.slug,
            type: room.type,
            isActive: room.isActive,
            metadata: room.metadata as any,
            slowModeSeconds: room.slowModeSeconds,
            minTierLevel: room.minTierLevel,
            lastMessageAt: room.lastMessageAt,
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
