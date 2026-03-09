import { Injectable, Inject } from '@nestjs/common';
import { CHAT_MESSAGE_REPOSITORY_PORT, type ChatMessageRepositoryPort } from '../ports/chat-message.repository.port';
import { ChatMessage, type ChatMessageMetadata } from '../domain/chat-message.entity';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';

import { SOCKET_EVENT_TYPES, type SocketChatMessageNewPayload } from 'src/infrastructure/websocket/types/socket-payload.types';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../ports/chat-room-member.repository.port';
import { ChatRoomNotFoundException, ChatRoomUnauthorizedException, ChatRoomInvalidFileTypeException } from '../domain/chat-room.exception';
import { ChatRoom } from '../domain/chat-room.entity';

import { ChatRoomType, ChatMessageType } from '@prisma/client';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { FileUsageType } from 'src/modules/file/domain';
import { AttachFileService } from 'src/modules/file/application/attach-file.service';

import { Transactional } from '@nestjs-cls/transactional';

export interface SendChatMessageParams {
    roomId: bigint;
    senderId: bigint | null;
    content: string;
    imageIds?: bigint[];
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
        private readonly attachFileService: AttachFileService,
    ) { }

    @Transactional()
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
        const messageId = snowflake.id;
        let metadata: ChatMessageMetadata | null = null;
        let messageType: ChatMessageType = ChatMessageType.TEXT;

        // 이미지 파일이 전송된 경우 처리
        if (params.imageIds && params.imageIds.length > 0) {
            const usageType = room.type === ChatRoomType.SUPPORT
                ? FileUsageType.SUPPORT_CHAT_MESSAGE
                : FileUsageType.CHAT_MESSAGE;

            const { files } = await this.attachFileService.execute({
                fileIds: params.imageIds,
                usageType: usageType,
                usageId: messageId,
            });

            if (files.length > 0) {
                // 하나라도 이미지가 아닌 파일이 포함되어 있으면 에러 처리
                const nonImageFile = files.find(f => !f.mimetype.startsWith('image/'));
                if (nonImageFile) {
                    throw new ChatRoomInvalidFileTypeException();
                }

                metadata = {
                    attachments: files.map(file => ({
                        fileId: file.id?.toString() || '',
                        type: 'IMAGE',
                        filename: file.filename,
                        mimetype: file.mimetype,
                        size: file.size.toString(),
                        width: file.width,
                        height: file.height,
                    })),
                };

                // 이미지가 포함된 경우 메시지 타입을 IMAGE로 설정
                messageType = ChatMessageType.IMAGE;
            }
        }

        const message = ChatMessage.create({
            id: messageId,
            roomId: params.roomId,
            content: params.content,
            senderId: params.senderId,
            type: messageType,
            metadata: metadata,
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
