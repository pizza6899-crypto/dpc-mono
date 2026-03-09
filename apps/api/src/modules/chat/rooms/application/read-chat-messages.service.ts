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

        // 실시간 알림 (상대방에게 읽었임을 알림)
        this.broadcastReadStatus(params.roomId, params.userId, params.lastReadMessageId, room.type);
    }

    private broadcastReadStatus(roomId: bigint, userId: bigint, lastReadMessageId: bigint, roomType: ChatRoomType): void {
        const encodedRoomId = this.sqidsService.encode(roomId, SqidsPrefix.CHAT_ROOM);
        const encodedUserId = this.sqidsService.encode(userId, SqidsPrefix.USER);
        const encodedMessageId = this.sqidsService.encode(lastReadMessageId, SqidsPrefix.CHAT_MESSAGE);

        const socketRoom = roomType === ChatRoomType.SUPPORT
            ? getSocketRoom.supportRoom(this.sqidsService.encode(roomId, SqidsPrefix.SUPPORT_ROOM))
            : getSocketRoom.chatRoom(encodedRoomId);

        const payload: SocketChatMessagesReadPayload = {
            roomId: encodedRoomId,
            userId: encodedUserId,
            lastReadMessageId: encodedMessageId,
        };

        this.websocketService.sendToRoom(socketRoom as any, SOCKET_EVENT_TYPES.CHAT_MESSAGES_READ, payload);
    }
}
