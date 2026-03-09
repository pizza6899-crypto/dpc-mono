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
        // 0. 동일 유저에 대한 중복 상담방 생성 방지를 위한 Advisory Lock 획득
        await this.advisoryLockService.acquireLock(LockNamespace.CHAT_ROOM, params.userId.toString());

        // 유저 ID 기반으로 활성화된(CLOSED가 아닌) 상담방 조회
        let room = await this.roomRepository.findActiveSupportRoomByUserId(params.userId);

        if (!room) {
            // 활성 상담방이 없으면 신규 생성
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
            // 방이 이미 존재한다면 (findActiveSupportRoomByUserId에서 이미 필터링됨)
            // 필요한 경우 여기서 추가적인 상태 업데이트를 할 수 있으나, 현재는 기존 방 반환
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
