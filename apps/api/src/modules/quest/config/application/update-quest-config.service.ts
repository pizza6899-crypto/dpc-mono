import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { QUEST_SYSTEM_CONFIG_REPOSITORY } from '../ports/quest-system-config.repository.token';
import type { QuestSystemConfigRepository } from '../ports/quest-system-config.repository.port';
import { QuestSystemConfig } from '../domain/quest-system-config.entity';
import { QuestConfigNotFoundException } from '../domain/quest-config.exception';
import { AdvisoryLockService } from 'src/common/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/common/concurrency/concurrency.constants';

export interface UpdateQuestConfigCommand {
  isSystemEnabled?: boolean;
}

@Injectable()
export class UpdateQuestConfigService {
  constructor(
    @Inject(QUEST_SYSTEM_CONFIG_REPOSITORY)
    private readonly questSystemConfigRepository: QuestSystemConfigRepository,
    private readonly lockService: AdvisoryLockService,
  ) {}

  /**
   * 관리자가 전역 퀘스트 설정을 수정합니다.
   * 싱글톤이므로 AdvisoryLock을 사용하여 동시 수정을 방지합니다.
   */
  @Transactional()
  async execute(command: UpdateQuestConfigCommand): Promise<QuestSystemConfig> {
    // 싱글톤 설정을 위한 락 획득 (ID: 1)
    await this.lockService.acquireLock(LockNamespace.QUEST_CONFIG, 1);

    const config = await this.questSystemConfigRepository.find();

    if (!config) {
      throw new QuestConfigNotFoundException();
    }

    // 도메인 엔티티의 비즈니스 메서드를 통해 정보 업데이트
    config.update(command);

    // 변경사항 저장 (리포지토리 내에서 캐시 무효화 발생)
    await this.questSystemConfigRepository.save(config);

    return config;
  }
}
