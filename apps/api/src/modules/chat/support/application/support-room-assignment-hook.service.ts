import { Injectable, Inject, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { OnWebsocketConnectHook } from 'src/infrastructure/websocket/interfaces/connection-hook.interface';
import {
  CHAT_ROOM_REPOSITORY_PORT,
  type ChatRoomRepositoryPort,
} from '../../rooms/ports/chat-room.repository.port';
import { ChatRoomType } from '@prisma/client';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';

/**
 * 관리자 상담방 배정 동기화 훅
 * 관리자일 경우 본인이 담당자로 지정된 모든 활성 상담방에 자동 조인시킵니다.
 */
@Injectable()
export class SupportRoomAssignmentHookService implements OnWebsocketConnectHook {
  private readonly logger = new Logger(SupportRoomAssignmentHookService.name);

  constructor(
    @Inject(CHAT_ROOM_REPOSITORY_PORT)
    private readonly roomRepository: ChatRoomRepositoryPort,
    private readonly sqidsService: SqidsService,
  ) {}

  async onConnect(
    client: Socket,
    userId: bigint,
    isAdmin: boolean,
  ): Promise<void> {
    if (!isAdmin) return;

    try {
      // 관리자가 담당자로 지정된 모든 활성 상담방 조회
      const assignedRooms =
        await this.roomRepository.findActiveRoomsByAdminId(userId);

      for (const room of assignedRooms) {
        this.joinRoom(client, room);
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync assigned support rooms for admin ${userId}: ${error.message}`,
      );
    }
  }

  private joinRoom(
    client: Socket,
    room: { id: bigint; type: ChatRoomType },
  ): void {
    const roomName = getSocketRoom.support(room.id);

    client.join(roomName);
    this.logger.debug(`Admin joined assigned support room: ${roomName}`);
  }
}
