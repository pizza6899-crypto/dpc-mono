import { Injectable, Inject } from '@nestjs/common';
import { CHAT_MESSAGE_REPOSITORY_PORT, type ChatMessageRepositoryPort } from '../ports/chat-message.repository.port';
import { ChatMessage } from '../domain/chat-message.entity';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';

import { SOCKET_EVENT_TYPES, type SocketChatMessageNewPayload } from 'src/infrastructure/websocket/types/socket-payload.types';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../ports/chat-room-member.repository.port';
import { ChatRoomNotFoundException, ChatRoomUnauthorizedException } from '../domain/chat-room.exception';
import { ChatRoom } from '../domain/chat-room.entity';

import { ChatRoomType, ChatMessageType } from '@prisma/client';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

export interface SendChatMessageParams {
    roomId: bigint;
    senderId: bigint | null;
    content: string;
    type?: ChatMessageType;
    fileId?: bigint;
}


@Injectable()
export class SendChatMessageService {
    constructor(
        @Inject(CHAT_MESSAGE_REPOSITORY_PORT)
        private readonly messageRepository: ChatMessageRepositoryPort,
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
        private readonly websocketService: WebsocketService,
        private readonly sqidsService: SqidsService,
    ) { }


    async execute(params: SendChatMessageParams): Promise<ChatMessage> {
        const room = await this.roomRepository.findById(params.roomId);
        if (!room) {
            throw new ChatRoomNotFoundException();
        }

        // 멤버십 확인 (채팅 참여 여부 검증)
        if (params.senderId) {
            const member = await this.memberRepository.findByRoomIdAndUserId(params.roomId, params.senderId);
            if (!member) {
                throw new ChatRoomUnauthorizedException();
            }

        }


        const snowflake = this.snowflakeService.generate();
        const message = ChatMessage.create({
            id: snowflake.id,
            roomId: params.roomId,
            content: params.content,
            senderId: params.senderId,
            type: params.type,
            metadata: params.fileId ? { fileId: params.fileId.toString() } : null,
        });


        const saved = await this.messageRepository.save(message);

        // 실시간 브로드캐스트
        this.broadcastMessage(saved, room);

        return saved;
    }

    private broadcastMessage(message: ChatMessage, room: ChatRoom): void {
        const encodedRoomId = this.sqidsService.encode(room.id, SqidsPrefix.CHAT_ROOM);

        // 룸 타입에 따른 소켓 룸 이름 결정
        const socketRoom = room.type === ChatRoomType.SUPPORT
            ? getSocketRoom.supportRoom(this.sqidsService.encode(room.id, SqidsPrefix.SUPPORT_ROOM))
            : getSocketRoom.chatRoom(encodedRoomId);


        // 페이로드 준비
        const payload: SocketChatMessageNewPayload = {
            id: this.sqidsService.encode(message.id, SqidsPrefix.CHAT_MESSAGE),
            roomId: encodedRoomId,
            senderId: message.senderId ? this.sqidsService.encode(message.senderId, SqidsPrefix.USER) : null,
            content: message.content,
            type: message.type,
            metadata: message.metadata,
            createdAt: message.createdAt.toISOString(),
        };

        this.websocketService.sendToRoom(socketRoom as any, SOCKET_EVENT_TYPES.CHAT_MESSAGE_NEW, payload);
    }
}
