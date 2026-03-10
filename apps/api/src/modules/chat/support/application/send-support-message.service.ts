import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { SendChatMessageService } from '../../rooms/application/send-chat-message.service';
import { ChatMessage } from '../../rooms/domain/chat-message.entity';
import { ChatRoomNotFoundException } from '../../rooms/domain/chat-room.exception';
import { ChatRoomType, SupportStatus } from '@prisma/client';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { USER_REPOSITORY } from 'src/modules/user/profile/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/profile/ports/out/user.repository.port';
import { CreateAlertService } from 'src/modules/notification/alert/application/create-alert.service';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_EVENT_TYPES } from 'src/infrastructure/websocket/types/socket-payload.types';
import { SOCKET_ROOMS } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { NOTIFICATION_EVENTS } from 'src/modules/notification/common';
import { SupportInquiryPolicy } from '../domain/support-inquiry.policy';

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
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryPort,
        private readonly createAlertService: CreateAlertService,
        private readonly websocketService: WebsocketService,
        private readonly sqidsService: SqidsService,
        private readonly policy: SupportInquiryPolicy,
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

        // 3. 상담 상태 자동 업데이트 및 알림 (Side-effects)
        await this.handleStatusUpdate(room, params.isAdmin, message);

        return message;
    }

    private async handleStatusUpdate(room: ChatRoom, isAdmin: boolean, message: ChatMessage): Promise<void> {
        const nextStatus = this.policy.calculateStatusOnMessage(room.supportInfo?.status || null, isAdmin);
        const isNewInquiry = this.policy.shouldNotifyAdmin(room.supportInfo?.status || null, isAdmin);

        // 관리자가 메시지를 보냈는데 담당자가 지정되지 않은 경우 자동 할당
        const shouldAssignAdmin = isAdmin && room.supportInfo && !room.supportInfo.adminId;

        if (nextStatus !== null || shouldAssignAdmin) {
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
                room.supportInfo ? {
                    ...room.supportInfo,
                    status: nextStatus ?? room.supportInfo.status,
                    adminId: shouldAssignAdmin ? message.senderId : room.supportInfo.adminId
                } : null,
            );
            await this.roomRepository.save(updatedRoom);
        }

        // 신규 상담 문의 발생 시 관리자 알림 발송
        if (isNewInquiry && !isAdmin) {
            await this.notifyAdminNewInquiry(room, message);
        }
    }

    private async notifyAdminNewInquiry(room: ChatRoom, message: ChatMessage): Promise<void> {
        if (!message.senderId) return;

        const sender = await this.userRepository.findById(message.senderId);
        const encodedRoomId = this.sqidsService.encode(room.id, SqidsPrefix.SUPPORT_ROOM);
        const encodedUserId = this.sqidsService.encode(message.senderId, SqidsPrefix.USER);

        // 1. WebSocket 알림 (Admin Room 전체)
        this.websocketService.sendToRoom(
            SOCKET_ROOMS.ADMIN,
            SOCKET_EVENT_TYPES.SUPPORT_INQUIRY_RECEIVED,
            {
                roomId: encodedRoomId,
                userId: encodedUserId,
                userNickname: sender?.nickname || 'Unknown',
                content: message.content,
                requestedAt: message.createdAt.toISOString(),
            },
        );

        // 2. 외부 알림 (Telegram 등 Alert 시스템 활용)
        await this.createAlertService.execute({
            event: NOTIFICATION_EVENTS.SUPPORT_INQUIRY_RECEIVED,
            payload: {
                roomId: encodedRoomId,
                userNickname: sender?.nickname || 'Unknown',
                content: message.content,
                category: room.supportInfo?.category || undefined,
            },
            // 동일 방에서 짧은 시간 내 중복 알림 방지를 위한 멱등성 키 (선택 사항)
            idempotencyKey: `support-alert:${room.id}:${message.createdAt.getTime()}`,
        });
    }
}
