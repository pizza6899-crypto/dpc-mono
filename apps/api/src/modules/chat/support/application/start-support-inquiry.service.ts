import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../rooms/ports/chat-room-member.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomMember } from '../../rooms/domain/chat-room-member.entity';
import { ChatRoomType, SupportStatus, SupportPriority, ChatMemberRole, SupportCategory } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface StartSupportInquiryParams {
    userId: bigint;
}


@Injectable()
export class StartSupportInquiryService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(params: StartSupportInquiryParams): Promise<ChatRoom> {
        // 0. 동일 유저에 대한 중복 상담방 생성 방지를 위한 Advisory Lock 획득 (유저 단위)
        await this.advisoryLockService.acquireLock(LockNamespace.USER_CHAT_SUPPORT, params.userId.toString());

        // 유저 ID 기반으로 상담방 조회 (과거 종료 내역 포함 유일한 방)
        let room = await this.roomRepository.findSupportRoomByUserId(params.userId);

        if (!room) {
            // 상담방이 아예 없으면 신규 생성
            room = new ChatRoom(
                0n,
                ChatRoomType.SUPPORT,
                true,
                {}, // metadata
                0,  // slowModeSeconds
                0,  // minTierLevel
                new Date(),
                new Date(),
                null,
                SupportStatus.ENTERED,
                SupportPriority.NORMAL,
                null,
                null, // subject는 추후 시스템 생성 로직 적용 예정
                null, // adminId
            );

        } else {
            // 방이 이미 존재하는데 종료(CLOSED) 상태라면 다시 ENTERED로 전환 (재오픈 대기)
            if (room.supportStatus === SupportStatus.CLOSED) {
                const reopenedRoom = new ChatRoom(
                    room.id,
                    room.type,
                    room.isActive,
                    room.metadata,
                    room.slowModeSeconds,
                    room.minTierLevel,
                    room.createdAt,
                    new Date(),
                    room.lastMessageAt,
                    SupportStatus.ENTERED,
                    room.supportPriority,
                    room.supportCategory,
                    room.supportSubject,
                    room.supportAdminId,
                );
                return this.roomRepository.save(reopenedRoom);
            }
            // 그 외 활성 상태(ENTERED, OPEN, ...)라면 그대로 반환
            return room;
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
