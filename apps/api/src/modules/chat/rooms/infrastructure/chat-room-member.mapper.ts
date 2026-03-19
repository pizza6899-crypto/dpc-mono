import { type PersistenceOf } from '../../../../infrastructure/persistence/persistence.util';
import {
  ChatRoomMember,
  type ChatRoomMemberRawPayload,
} from '../domain/chat-room-member.entity';
import { Cast } from '../../../../infrastructure/persistence/persistence.util';

export class ChatRoomMemberMapper {
  public static toDomain(
    data: PersistenceOf<ChatRoomMemberRawPayload>,
  ): ChatRoomMember {
    return new ChatRoomMember(
      Cast.bigint(data.id),
      Cast.bigint(data.roomId),
      Cast.bigint(data.userId),
      data.role,
      data.lastReadMessageId ? Cast.bigint(data.lastReadMessageId) : null,
      Cast.date(data.createdAt),
    );
  }
}
