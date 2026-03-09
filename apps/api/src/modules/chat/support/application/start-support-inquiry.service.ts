import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../rooms/ports/chat-room-member.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomMember } from '../../rooms/domain/chat-room-member.entity';

import { ChatRoomType, SupportStatus, SupportPriority, ChatMemberRole } from '@prisma/client';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';

export interface StartSupportInquiryParams {
    userId: bigint;
    category?: string;
    subject?: string;
    priority?: SupportPriority;
}

@Injectable()
export class StartSupportInquiryService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: StartSupportInquiryParams): Promise<ChatRoom> {
        const slug = getSocketRoom.supportRoom(`u:${params.userId}`);
        let room = await this.roomRepository.findBySlug(slug);

        if (!room) {
            // 방이 없으면 신규 생성
            room = new ChatRoom(
                0n,
                slug,
                ChatRoomType.SUPPORT,
                true,
                {}, // metadata
                0,  // slowModeSeconds
                0,  // minTierLevel
                new Date(),
                new Date(),
                null,
                SupportStatus.OPEN,
                params.priority ?? SupportPriority.NORMAL,
                params.category ?? null,
                params.subject ?? null,
                null, // adminId
            );
        } else {
            // 방이 있으면 상태를 OPEN으로 변경하고 상담 정보 업데이트
            room = new ChatRoom(
                room.id,
                room.slug,
                room.type,
                true, // isActive
                room.metadata,
                room.slowModeSeconds,
                room.minTierLevel,
                room.createdAt,
                new Date(),
                room.lastMessageAt,
                SupportStatus.OPEN,
                params.priority ?? room.supportPriority ?? SupportPriority.NORMAL,
                params.category ?? room.supportCategory,
                params.subject ?? room.supportSubject,
                null, // 새로운 문의이므로 담당자 초기화 (상황에 따라 유지할 수도 있음)
            );
        }

        const savedRoom = await this.roomRepository.save(room);

        // 유저 멤버십 확인
        const existingMember = await this.memberRepository.findByRoomIdAndUserId(savedRoom.id, params.userId);
        if (!existingMember) {
            const newMember = new ChatRoomMember(
                0n,
                savedRoom.id,
                params.userId,
                ChatMemberRole.MEMBER,
                null,
                new Date(),
            );
            await this.memberRepository.save(newMember);
        }

        return savedRoom;
    }
}
