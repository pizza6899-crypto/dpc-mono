import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { ChatRoom } from '../domain/chat-room.entity';
import { ChatRoomType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface CreateChatRoomParams {
    slug?: string;
    type: ChatRoomType;
    isActive?: boolean;
    metadata?: any;
    slowModeSeconds?: number;
    minTierLevel?: number;
}

@Injectable()
export class CreateChatRoomService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        private readonly lockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(params: CreateChatRoomParams): Promise<ChatRoom> {
        const lockKey = params.slug ? params.slug : 'global-chat';

        await this.lockService.acquireLock(
            LockNamespace.CHAT_ROOM,
            lockKey,
            { throwThrottleError: true }
        );

        const room = new ChatRoom(
            0n, // Placeholder for autoincrement
            params.slug || null,
            params.type,
            params.isActive ?? true,
            params.metadata ?? {},
            params.slowModeSeconds ?? 0,
            params.minTierLevel ?? 0,
            new Date(),
            new Date(),
            null,
        );

        return await this.roomRepository.save(room);
    }
}
