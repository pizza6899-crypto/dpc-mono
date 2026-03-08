import { Inject, Injectable } from '@nestjs/common';
import { CHAT_ROOM_MEMBER_REPOSITORY_PORT, type ChatRoomMemberRepositoryPort } from '../ports/chat-room-member.repository.port';

export interface LeaveChatRoomParams {
    roomId: bigint;
    userId: bigint;
}

@Injectable()
export class LeaveChatRoomService {
    constructor(
        @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
        private readonly memberRepository: ChatRoomMemberRepositoryPort,
    ) { }

    async execute(params: LeaveChatRoomParams): Promise<void> {
        // We don't necessarily need to check if the room exists here, 
        // as the repository delete will handle it or just do nothing if not found.
        await this.memberRepository.delete(params.roomId, params.userId);
    }
}
