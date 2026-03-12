import { Injectable, Inject } from '@nestjs/common';
import { QUEST_SYSTEM_CONFIG_REPOSITORY } from '../ports/quest-system-config.repository.token';
import type { QuestSystemConfigRepository } from '../ports/quest-system-config.repository.port';
import { QuestSystemConfig } from '../domain/quest-system-config.entity';
import { QuestConfigNotFoundException } from '../domain/quest-config.exception';

@Injectable()
export class GetQuestConfigService {
  constructor(
    @Inject(QUEST_SYSTEM_CONFIG_REPOSITORY)
    private readonly questSystemConfigRepository: QuestSystemConfigRepository,
  ) {}

  /**
   * 전역 퀘스트 설정 정보를 조회합니다.
   */
  async execute(): Promise<QuestSystemConfig> {
    const config = await this.questSystemConfigRepository.find();

    if (!config) {
      throw new QuestConfigNotFoundException();
    }

    return config;
  }
}
