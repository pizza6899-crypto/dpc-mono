import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../../rooms/ports/chat-room-member.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomMember } from '../../rooms/domain/chat-room-member.entity';
import { ChatRoomType, SupportStatus, SupportPriority, ChatMemberRole, SupportCategory } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SupportInquiryPolicy } from '../domain/support-inquiry.policy';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';

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
        private readonly policy: SupportInquiryPolicy,
        private readonly websocketService: WebsocketService,
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
                {
                    status: SupportStatus.ENTERED,
                    priority: SupportPriority.NORMAL,
                    category: null,
                    subject: null,
                    adminId: null,
                    adminLastReadId: null,
                }
            );

        } else {
            // 방이 이미 존재하는데 특정 상태라면 초기화(예: CLOSED -> ENTERED) 판단을 policy에 위임
            const nextStatus = this.policy.getStatusForReopening(room.supportInfo?.status || null);
            if (nextStatus !== null) {
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
                    room.supportInfo ? { ...room.supportInfo, status: nextStatus } : null,
                );
                const saved = await this.roomRepository.save(reopenedRoom);
                // 소켓 룸 가입
                await this.websocketService.joinChatRoom(params.userId, saved.id, saved.type);
                return saved;
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

        // 소켓 룸 가입 (기존에 가입되어 있더라도 중복 가입은 안전함)
        await this.websocketService.joinChatRoom(params.userId, savedRoom.id, savedRoom.type);

        return savedRoom;
    }
}
