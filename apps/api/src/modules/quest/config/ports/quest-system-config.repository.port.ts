import { QuestSystemConfig } from '../domain/quest-system-config.entity';

export interface QuestSystemConfigRepository {
  find(): Promise<QuestSystemConfig | null>;
  save(config: QuestSystemConfig): Promise<void>;
}
