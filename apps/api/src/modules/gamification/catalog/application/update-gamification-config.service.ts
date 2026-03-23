import { Inject, Injectable } from '@nestjs/common';
import { GamificationConfigNotFoundException } from '../domain/catalog.exception';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import {
  GAMIFICATION_CONFIG_REPOSITORY_PORT,
} from '../ports/gamification-config.repository.port';
import type { GamificationConfigRepositoryPort } from '../ports/gamification-config.repository.port';
import { GamificationConfig } from '../domain/gamification-config.entity';

/**
 * 게이미피케이션 정책 업데이트를 위한 파라미터 규격
 */
export interface UpdateGamificationConfigParams {
  expGrantMultiplierUsd?: Prisma.Decimal;
  statPointGrantPerLevel?: number;
  maxStatLimit?: number;
  statResetPrice?: Prisma.Decimal;
  statResetCurrency?: ExchangeCurrencyCode;
}

@Injectable()
export class UpdateGamificationConfigService {
  constructor(
    @Inject(GAMIFICATION_CONFIG_REPOSITORY_PORT)
    private readonly repository: GamificationConfigRepositoryPort,
  ) { }

  /**
   * 전역 게이미피케이션 정책 설정을 업데이트합니다.
   * 싱글톤 엔티티를 조회한 후, 입력된 필드들만 부분적으로 수정하여 영속화합니다.
   */
  async execute(params: UpdateGamificationConfigParams): Promise<GamificationConfig> {
    const existingConfig = await this.repository.findConfig();

    if (!existingConfig) {
      throw new GamificationConfigNotFoundException();
    }

    // 도메인 엔티티의 책임으로 상태 변경 위임
    existingConfig.update(params);

    await this.repository.saveConfig(existingConfig);

    return existingConfig;
  }
}
