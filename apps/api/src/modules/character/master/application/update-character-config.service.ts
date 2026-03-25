import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterConfigNotFoundException } from '../domain/master.exception';
import { Prisma } from '@prisma/client';
import {
  CHARACTER_CONFIG_REPOSITORY_PORT,
} from '../ports/character-config.repository.port';
import type { CharacterConfigRepositoryPort } from '../ports/character-config.repository.port';
import { CharacterConfig, StatResetPriceTable } from '../domain/character-config.entity';

/**
 * 게이미피케이션 정책 업데이트를 위한 파라미터 규격
 */
export interface UpdateCharacterConfigParams {
  xpGrantMultiplierUsd?: Prisma.Decimal;
  statPointsGrantPerLevel?: number;
  maxStatLimit?: number;
  statResetPrices?: StatResetPriceTable;
}

@Injectable()
export class UpdateCharacterConfigService {
  constructor(
    @Inject(CHARACTER_CONFIG_REPOSITORY_PORT)
    private readonly repository: CharacterConfigRepositoryPort,
  ) { }

  /**
   * 전역 게이미피케이션 정책 설정을 업데이트합니다.
   * 싱글톤 엔티티를 조회한 후, 입력된 필드들만 부분적으로 수정하여 영속화합니다.
   */
  @Transactional()
  async execute(params: UpdateCharacterConfigParams): Promise<CharacterConfig> {
    const existingConfig = await this.repository.findConfig();

    if (!existingConfig) {
      throw new CharacterConfigNotFoundException();
    }

    // 도메인 엔티티의 책임으로 상태 변경 위임
    existingConfig.update(params);

    await this.repository.saveConfig(existingConfig);

    return existingConfig;
  }
}
