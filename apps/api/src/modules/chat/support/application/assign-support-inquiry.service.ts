import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../rooms/ports/chat-room-member.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomMember } from '../../rooms/domain/chat-room-member.entity';
import { ChatRoomNotFoundException } from '../../rooms/domain/chat-room.exception';
import { SupportStatus, ChatRoomType, ChatMemberRole } from '@prisma/client';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SupportInquiryAssignToClosedException } from '../domain/support-inquiry.exception';

export interface AssignSupportInquiryParams {
    roomId: bigint;
    adminId: bigint;
}

@Injectable()
export class AssignSupportInquiryService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        private readonly websocketService: WebsocketService,
    ) { }

    @Transactional()
    async execute(params: AssignSupportInquiryParams): Promise<ChatRoom> {
        const room = await this.roomRepository.findById(params.roomId);
        if (!room || room.type !== ChatRoomType.SUPPORT) {
            throw new ChatRoomNotFoundException();
        }

        // 1. 상태 검증: 종료된 상담은 담당자 배정 불가
        if (room.supportInfo?.status === SupportStatus.CLOSED) {
            throw new SupportInquiryAssignToClosedException();
        }

        // 2. DB 멤버십 확인 및 추가 (Authorization 보장)
        const existingMember = await this.memberRepository.findByRoomIdAndUserId(params.roomId, params.adminId);
        if (!existingMember) {
            const newMember = new ChatRoomMember(
                0n,
                params.roomId,
                params.adminId,
                ChatMemberRole.ADMIN,
                null,
                new Date(),
            );
            await this.memberRepository.save(newMember);
        }

        // 3. 배정 정보 업데이트 및 상태를 'IN_PROGRESS'로 변경
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
                adminId: params.adminId,
                status: SupportStatus.IN_PROGRESS,
            } : null,
        );

        const saved = await this.roomRepository.save(updatedRoom);

        // 4. 관리자를 소켓 룸에 즉시 가입시킴 (실시간 수신 보장)
        await this.websocketService.joinChatRoom(params.adminId, saved.id, saved.type);

        return saved;
    }
}
