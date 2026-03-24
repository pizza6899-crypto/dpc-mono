import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';
import { LevelDefinition } from '../domain/level-definition.entity';
import { LevelDefinitionRepositoryPort } from '../ports/level-definition.repository.port';
import { LevelDefinitionMapper } from './level-definition.mapper';

@Injectable()
export class PrismaLevelDefinitionRepository implements LevelDefinitionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: LevelDefinitionMapper,
    private readonly cacheService: CacheService,
  ) { }

  /**
   * 모든 레벨 정의 조회 (캐시 L1 지원)
   */
  async findAll(): Promise<LevelDefinition[]> {
    const rawList = await this.cacheService.getOrSet(
      CACHE_CONFIG.GAMIFICATION.LEVEL_LIST,
      async () => {
        const records = await this.tx.levelDefinition.findMany({
          orderBy: { level: 'asc' },
        });

        // Decimal/BigInt 안전 변환 후 캐싱
        return JSON.parse(JSON.stringify(records));
      },
    );

    return rawList.map((raw: any) => this.mapper.toDomain(raw));
  }

  /**
   * 특정 레벨 조회
   */
  async findByLevel(level: number): Promise<LevelDefinition | null> {
    const all = await this.findAll();
    return all.find((l) => l.level === level) || null;
  }

  /**
   * 특정 경험치(XP)에서 도달 가능한 최고 레벨 찾기
   */
  async findLevelByXp(xp: number): Promise<LevelDefinition | null> {
    const all = await this.findAll();

    // 내림차순 정렬하여 경험치 조건을 만족하는 첫 번째 레벨 반환
    const sortedDesc = [...all].sort((a, b) => b.level - a.level);

    return sortedDesc.find((l) => l.requiredXp.lessThanOrEqualTo(xp)) || null;
  }

  /**
   * 레벨 정의 저장 및 캐시 무효화
   */
  async save(levelDefinition: LevelDefinition): Promise<void> {
    const data = this.mapper.toPrisma(levelDefinition);

    await this.tx.levelDefinition.update({
      where: { level: levelDefinition.level },
      data,
    });

    // 상태 변경 시 목록 캐시 삭제
    await this.cacheService.del(CACHE_CONFIG.GAMIFICATION.LEVEL_LIST);
  }
}
