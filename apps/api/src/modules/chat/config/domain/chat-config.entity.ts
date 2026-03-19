import { type Prisma } from '@prisma/client';
import {
  Cast,
  type PersistenceOf,
} from 'src/infrastructure/persistence/persistence.util';

export type ChatConfigRawPayload = Prisma.ChatConfigGetPayload<object>;

export class ChatConfig {
  public static readonly SINGLETON_ID = 1;

  constructor(
    public readonly isGlobalChatEnabled: boolean,
    public readonly maxMessageLength: number,
    public readonly defaultSlowModeSeconds: number,
    public readonly minChatTierLevel: number,
    public readonly blockDuplicateMessages: boolean,
    public readonly updatedAt: Date,
  ) {}

  public static fromPersistence(
    data: PersistenceOf<ChatConfigRawPayload>,
  ): ChatConfig {
    return new ChatConfig(
      data.isGlobalChatEnabled,
      data.maxMessageLength,
      data.defaultSlowModeSeconds,
      data.minChatTierLevel,
      data.blockDuplicateMessages,
      Cast.date(data.updatedAt),
    );
  }
}
