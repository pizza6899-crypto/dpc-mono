import { type PersistenceOf, Cast } from '../../../../infrastructure/persistence/persistence.util';
import { ChatMessage, type ChatMessageRawPayload } from '../domain/chat-message.entity';

export class ChatMessageMapper {
    public static toDomain(data: PersistenceOf<ChatMessageRawPayload>): ChatMessage {
        return new ChatMessage(
            Cast.bigint(data.id),
            Cast.bigint(data.roomId),
            data.content,
            data.type,
            data.senderId ? Cast.bigint(data.senderId) : null,
            data.metadata,
            data.isPinned,
            data.isDeleted,
            Cast.date(data.createdAt),
        );
    }
}
