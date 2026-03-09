import { type PersistenceOf } from '../../../../infrastructure/persistence/persistence.util';
import { ChatRoom, type ChatRoomRawPayload } from '../domain/chat-room.entity';
import { Cast } from '../../../../infrastructure/persistence/persistence.util';

export class ChatRoomMapper {
    public static toDomain(data: PersistenceOf<ChatRoomRawPayload>): ChatRoom {
        return new ChatRoom(
            Cast.bigint(data.id),
            data.type,
            data.isActive,
            data.metadata,
            data.slowModeSeconds,
            data.minTierLevel,
            Cast.date(data.createdAt),
            Cast.date(data.updatedAt),
            data.lastMessageAt ? Cast.date(data.lastMessageAt) : null,
            data.supportStatus,
            data.supportPriority,
            data.supportCategory,
            data.supportSubject,
            data.supportAdminId ? Cast.bigint(data.supportAdminId) : null,
        );

    }
}
