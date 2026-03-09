import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { SendChatMessageService } from '../../rooms/application/send-chat-message.service';
import { ChatMessage } from '../../rooms/domain/chat-message.entity';
import { ChatRoomNotFoundException } from '../../rooms/domain/chat-room.exception';
import { ChatRoomType, SupportStatus, ChatMessageType } from '@prisma/client';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';

export interface SendSupportMessageParams {
    roomId: bigint;
    senderId: bigint;
    content: string;
    isAdmin: boolean;
    imageIds?: bigint[];
}

@Injectable()
export class SendSupportMessageService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        private readonly sendChatMessageService: SendChatMessageService,
    ) { }

    @Transactional()
    async execute(params: SendSupportMessageParams): Promise<ChatMessage> {
        // 1. 방 존재 여부 및 상담방 여부 확인
        const room = await this.roomRepository.findById(params.roomId);
        if (!room || room.type !== ChatRoomType.SUPPORT) {
            throw new ChatRoomNotFoundException();
        }

        // 2. 채팅 메시지 전송 (기본 코어 로직 재사용)
        const message = await this.sendChatMessageService.execute({
            roomId: params.roomId,
            senderId: params.senderId,
            content: params.content,
            imageIds: params.imageIds,
        });

        // 3. 상담 상태 자동 업데이트 (Side-effects)
        await this.handleStatusUpdate(room, params.isAdmin);

        return message;
    }

    private async handleStatusUpdate(room: ChatRoom, isAdmin: boolean): Promise<void> {
        let nextStatus: SupportStatus | null = null;

        if (isAdmin) {
            // 관리자가 답장하면 '상담 중'으로 변경 (OPEN인 경우)
            if (room.supportStatus === SupportStatus.OPEN) {
                nextStatus = SupportStatus.IN_PROGRESS;
            }
        } else {
            // 유저가 메시지를 보내면:
            // 1. 처음 입장(ENTERED) 상태이면 -> OPEN (관리자 리스트 노출 시작)
            // 2. 상담 종료(CLOSED) 상태였으면 -> OPEN (재오픈)
            // 3. 펜딩(PENDING) 상태였으면 -> OPEN (알림 대응)
            if (
                room.supportStatus === SupportStatus.ENTERED ||
                room.supportStatus === SupportStatus.CLOSED ||
                room.supportStatus === SupportStatus.PENDING
            ) {
                nextStatus = SupportStatus.OPEN;
            }
        }

        if (nextStatus) {
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
                nextStatus,
                room.supportPriority,
                room.supportCategory,
                room.supportSubject,
                room.supportAdminId,
            );
            await this.roomRepository.save(updatedRoom);
        }
    }
}
