import { Injectable, Inject, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { OnWebsocketConnectHook } from 'src/infrastructure/websocket/interfaces/connection-hook.interface';
import {
  CHAT_ROOM_REPOSITORY_PORT,
  type ChatRoomRepositoryPort,
} from '../ports/chat-room.repository.port';
import {
  CHAT_ROOM_MEMBER_REPOSITORY_PORT,
  type ChatRoomMemberRepositoryPort,
} from '../ports/chat-room-member.repository.port';
import { ChatRoomType } from '@prisma/client';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';

/**
 * 일반 채팅방 멤버십 동기화 훅
 * 유저/관리자 공통으로 자신이 멤버로 가입된 모든 활성 채팅방에 조인시킵니다.
 */
@Injectable()
export class ChatRoomMembershipHookService implements OnWebsocketConnectHook {
  private readonly logger = new Logger(ChatRoomMembershipHookService.name);

  constructor(
    @Inject(CHAT_ROOM_REPOSITORY_PORT)
    private readonly roomRepository: ChatRoomRepositoryPort,
    @Inject(CHAT_ROOM_MEMBER_REPOSITORY_PORT)
    private readonly memberRepository: ChatRoomMemberRepositoryPort,
  ) {}

  async onConnect(client: Socket, userId: bigint): Promise<void> {
    try {
      // 유저/관리자 구분 없이 멤버로 등록된 모든 활성 방 조회
      const members = await this.memberRepository.listByUserId(userId);

      for (const member of members) {
        const room = await this.roomRepository.findById(member.roomId);
        if (room && room.isActive) {
          this.joinRoom(client, room);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync chat room memberships for user ${userId}: ${error.message}`,
      );
    }
  }

  private joinRoom(
    client: Socket,
    room: { id: bigint; type: ChatRoomType },
  ): void {
    const isSupport = room.type === ChatRoomType.SUPPORT;
    const roomName = isSupport
      ? getSocketRoom.support(room.id)
      : getSocketRoom.chat(room.id);

    client.join(roomName);
    this.logger.debug(
      `Joined membership socket room: ${roomName} (userId: ${client.id})`,
    );
  }
}
