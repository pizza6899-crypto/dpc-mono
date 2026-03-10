import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomNotFoundException } from '../../rooms/domain/chat-room.exception';
import { SupportStatus, SupportPriority, SupportCategory, ChatRoomType } from '@prisma/client';
import { SupportInquiryStatusUpdateRestrictedException } from '../domain/support-inquiry.exception';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';

export interface UpdateSupportInquiryParams {
    roomId: bigint;
    status?: SupportStatus;
    priority?: SupportPriority;
    category?: SupportCategory;
    adminId?: bigint;
}

@Injectable()
export class UpdateSupportInquiryService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        private readonly websocketService: WebsocketService,
    ) { }

    @Transactional()
    async execute(params: UpdateSupportInquiryParams): Promise<ChatRoom> {
        // CLOSED 상태로의 변경은 전용 Close 서비스를 이용해야 함
        if (params.status === SupportStatus.CLOSED) {
            throw new SupportInquiryStatusUpdateRestrictedException();
        }

        const room = await this.roomRepository.findById(params.roomId);
        if (!room || room.type !== ChatRoomType.SUPPORT) {
            throw new ChatRoomNotFoundException();
        }

        // 기존 supportInfo가 없으면 초기화 (보안상 SUPPORT 타입이면 반드시 있어야 함)
        const currentInfo = room.supportInfo || {
            status: SupportStatus.OPEN,
            priority: SupportPriority.NORMAL,
            category: null,
            subject: null,
            adminId: null,
        };

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
                status: params.status ?? currentInfo.status,
                priority: params.priority ?? currentInfo.priority,
                category: params.category ?? currentInfo.category,
                subject: currentInfo.subject,
                adminId: params.adminId ?? currentInfo.adminId,
            }
        );

        const saved = await this.roomRepository.save(updatedRoom);

        // 관리자가 새로 할당되거나 변경된 경우 해당 관리자를 소켓 룸에 가입시킴
        if (params.adminId) {
            await this.websocketService.joinChatRoom(params.adminId, saved.id, saved.type);
        }

        return saved;
    }
}
