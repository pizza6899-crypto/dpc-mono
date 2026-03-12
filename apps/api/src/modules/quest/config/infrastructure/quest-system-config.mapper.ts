import { QuestSystemConfig as PrismaQuestSystemConfig } from '@prisma/client';
import { QuestSystemConfig } from '../domain/quest-system-config.entity';

export class QuestSystemConfigMapper {
  /**
   * DB 모델(Prisma)을 도메인 엔티티로 변환합니다.
   */
  static toDomain(record: PrismaQuestSystemConfig): QuestSystemConfig {
    return QuestSystemConfig.fromPersistence({
      id: record.id,
      isSystemEnabled: record.isSystemEnabled,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * 엔티티의 현재 상태를 저장 가능한 데이터 객체로 변환합니다.
   */
  static toPersistence(entity: QuestSystemConfig) {
    return {
      isSystemEnabled: entity.isSystemEnabled,
    };
  }
}
