import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  CHAT_ROOM_REPOSITORY_PORT,
  type ChatRoomRepositoryPort,
} from '../../rooms/ports/chat-room.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomNotFoundException } from '../../rooms/domain/chat-room.exception';
import { SupportStatus, ChatRoomType } from '@prisma/client';

export interface CloseSupportInquiryParams {
  roomId: bigint;
}

@Injectable()
export class CloseSupportInquiryService {
  constructor(
    @Inject(CHAT_ROOM_REPOSITORY_PORT)
    private readonly roomRepository: ChatRoomRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: CloseSupportInquiryParams): Promise<ChatRoom> {
    const room = await this.roomRepository.findById(params.roomId);
    if (!room || room.type !== ChatRoomType.SUPPORT) {
      throw new ChatRoomNotFoundException();
    }

    // 이미 종료된 경우 무시하거나 예외 처리 가능
    if (room.supportInfo?.status === SupportStatus.CLOSED) {
      return room;
    }

    const closedRoom = new ChatRoom(
      room.id,
      room.type,
      room.isActive, // 상담 종료 시에도 활성화 상태 유지
      room.metadata,
      room.slowModeSeconds,
      room.minTierLevel,
      room.createdAt,
      new Date(),
      room.lastMessageAt,
      room.supportInfo
        ? {
            ...room.supportInfo,
            status: SupportStatus.CLOSED,
            adminLastReadId: room.supportInfo.adminLastReadId,
          }
        : null,
    );

    return this.roomRepository.save(closedRoom);
  }
}
