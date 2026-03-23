import { Inject, Injectable } from '@nestjs/common';
import { GamificationConfigNotFoundException } from '../domain/catalog.exception';
import { GamificationConfig } from '../domain/gamification-config.entity';
import {
  GAMIFICATION_CONFIG_REPOSITORY_PORT,
} from '../ports/gamification-config.repository.port';
import type { GamificationConfigRepositoryPort } from '../ports/gamification-config.repository.port';

@Injectable()
export class GetGamificationConfigService {
  constructor(
    @Inject(GAMIFICATION_CONFIG_REPOSITORY_PORT)
    private readonly repository: GamificationConfigRepositoryPort,
  ) { }

  /**
   * 전역 게이미피케이션 정책 설정을 조회합니다.
   * 데이터가 없을 경우 시스템 장애로 간주하여 예외를 발생시킵니다 (Seeding 필수).
   */
  async execute(): Promise<GamificationConfig> {
    const config = await this.repository.findConfig();

    if (!config) {
      throw new GamificationConfigNotFoundException();
    }

    return config;
  }
}
