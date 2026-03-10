import { Injectable, Inject } from '@nestjs/common';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../ports/chat-room-member.repository.port';
import { ChatRoomUnauthorizedException, ChatRoomNotFoundException } from '../domain/chat-room.exception';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_EVENT_TYPES, type SocketChatMessagesReadPayload } from 'src/infrastructure/websocket/types/socket-payload.types';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { ChatRoomType } from '@prisma/client';
import { ChatRoom } from '../domain/chat-room.entity';
import { ChatRoomMember } from '../domain/chat-room-member.entity';

export interface ReadChatMessagesParams {
    roomId: bigint;
    userId: bigint;
    lastReadMessageId: bigint;
}

@Injectable()
export class ReadChatMessagesService {
    constructor(
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        private readonly websocketService: WebsocketService,
        private readonly sqidsService: SqidsService,
    ) { }

    async execute(params: ReadChatMessagesParams): Promise<void> {
        const member = await this.memberRepository.findByRoomIdAndUserId(params.roomId, params.userId);
        if (!member) {
            throw new ChatRoomUnauthorizedException();
        }

        const room = await this.roomRepository.findById(params.roomId);
        if (!room) {
            throw new ChatRoomNotFoundException();
        }

        const updatedMember = new ChatRoomMember(
            member.id,
            member.roomId,
            member.userId,
            member.role,
            params.lastReadMessageId,
            member.createdAt,
        );

        await this.memberRepository.save(updatedMember);

        // 만약 상담방(SUPPORT)이고 관리자(ADMIN)가 읽은 경우, 공용 관리자 읽음 포인터 업데이트
        if (room.type === ChatRoomType.SUPPORT && member.role === 'ADMIN') {
            const updatedRoom = new ChatRoom(
                room.id,
                room.type,
                room.isActive,
                room.metadata,
                room.slowModeSeconds,
                room.minTierLevel,
                room.createdAt,
                new Date(),
                room.lastMessageAt,
                {
                    ...room.supportInfo!,
                    adminLastReadId: params.lastReadMessageId,
                }
            );
            await this.roomRepository.save(updatedRoom);
        }

        // 실시간 알림 (상대방에게 읽었임을 알림)
        this.broadcastReadStatus(params.roomId, params.userId, params.lastReadMessageId, room.type);
    }

    private broadcastReadStatus(roomId: bigint, userId: bigint, lastReadMessageId: bigint, roomType: ChatRoomType): void {
        const encodedRoomId = this.sqidsService.encode(roomId, SqidsPrefix.CHAT_ROOM);
        const encodedUserId = this.sqidsService.encode(userId, SqidsPrefix.USER);
        const encodedMessageId = this.sqidsService.encode(lastReadMessageId, SqidsPrefix.CHAT_MESSAGE);

        const socketRoom = roomType === ChatRoomType.SUPPORT
            ? getSocketRoom.support(roomId)
            : getSocketRoom.chat(roomId);

        const payload: SocketChatMessagesReadPayload = {
            roomId: encodedRoomId,
            userId: encodedUserId,
            lastReadMessageId: encodedMessageId,
        };

        this.websocketService.sendToRoom(socketRoom as any, SOCKET_EVENT_TYPES.CHAT_MESSAGES_READ, payload);
    }
}
