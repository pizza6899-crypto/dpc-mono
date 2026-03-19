import { type PersistenceOf } from '../../../../infrastructure/persistence/persistence.util';
import { ChatRoom, type ChatRoomRawPayload } from '../domain/chat-room.entity';
import { Cast } from '../../../../infrastructure/persistence/persistence.util';

export class ChatRoomMapper {
  public static toDomain(data: PersistenceOf<ChatRoomRawPayload>): ChatRoom {
    const supportInfo = data.supportStatus
      ? {
          status: data.supportStatus,
          priority: data.supportPriority!,
          category: data.supportCategory!,
          subject: data.supportSubject!,
          adminId: data.supportAdminId
            ? Cast.bigint(data.supportAdminId)
            : null,
          adminLastReadId: data.supportAdminLastReadId
            ? Cast.bigint(data.supportAdminLastReadId)
            : null,
        }
      : null;

    return new ChatRoom(
      Cast.bigint(data.id),
      data.type,
      data.isActive,
      (data.metadata ?? {}) as any,
      data.slowModeSeconds,
      data.minTierLevel,
      Cast.date(data.createdAt),
      Cast.date(data.updatedAt),
      data.lastMessageAt ? Cast.date(data.lastMessageAt) : null,
      supportInfo,
    );
  }
}
