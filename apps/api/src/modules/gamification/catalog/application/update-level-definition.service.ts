import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { LevelDefinitionNotFoundException } from '../domain/catalog.exception';
import { Prisma, TierCode } from '@prisma/client';
import {
  LEVEL_DEFINITION_REPOSITORY_PORT,
} from '../ports/level-definition.repository.port';
import type { LevelDefinitionRepositoryPort } from '../ports/level-definition.repository.port';
import { LevelDefinition } from '../domain/level-definition.entity';

/**
 * 레벨 정의 업데이트 및 생성 정보 규격
 */
export interface SaveLevelDefinitionParams {
  level: number;
  requiredXp?: Prisma.Decimal;
  tierCode?: TierCode;
  tierImageUrl?: string | null;
  statPointsBoost?: number;
}

@Injectable()
export class UpdateLevelDefinitionService {
  constructor(
    @Inject(LEVEL_DEFINITION_REPOSITORY_PORT)
    private readonly repository: LevelDefinitionRepositoryPort,
  ) { }

  /**
   * 레벨 정의를 업데이트하거나, 해당 레벨이 없으면 새로 생성합니다 (Admin).
   */
  @Transactional()
  async execute(params: SaveLevelDefinitionParams): Promise<LevelDefinition> {
    let levelDefinition = await this.repository.findByLevel(params.level);

    if (!levelDefinition) {
      // 새로운 레벨 정의 생성 (최소 필수 필드인 requiredXp 보장)
      levelDefinition = LevelDefinition.rehydrate({
        level: params.level,
        requiredXp: params.requiredXp ?? new Prisma.Decimal(0),
        tierCode: params.tierCode ?? TierCode.WHITE,
        tierImageUrl: params.tierImageUrl ?? null,
        statPointsBoost: params.statPointsBoost ?? 1,
        updatedAt: new Date(),
      });
    } else {
      // 기존 레벨 정보 업데이트
      levelDefinition.update({
        ...params,
      });
    }

    await this.repository.save(levelDefinition);

    return levelDefinition;
  }
}
