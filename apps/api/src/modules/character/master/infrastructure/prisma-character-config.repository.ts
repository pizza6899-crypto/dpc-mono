import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';
import { CharacterConfig } from '../domain/character-config.entity';
import { CharacterConfigRepositoryPort } from '../ports/character-config.repository.port';
import { CharacterConfigMapper } from './character-config.mapper';

@Injectable()
export class PrismaCharacterConfigRepository implements CharacterConfigRepositoryPort {

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CharacterConfigMapper,
    private readonly cacheService: CacheService,
  ) { }

  async findConfig(): Promise<CharacterConfig | null> {
    const raw = await this.cacheService.getOrSet(
      CACHE_CONFIG.CHARACTER.CONFIG,
      async () => {
        const record = await this.tx.characterConfig.findFirst({
          where: { id: CharacterConfig.CONFIG_ID },
        });

        if (!record) return null;

        // 캐싱 시 순수 데이터 객체로 보관하기 위해 안전하게 변환
        return JSON.parse(JSON.stringify(record));
      },
    );

    if (!raw) return null;
    return this.mapper.toDomain(raw);
  }

  async saveConfig(config: CharacterConfig): Promise<void> {
    const data = this.mapper.toPrismaUpsert(config);
    await this.tx.characterConfig.upsert({
      where: { id: CharacterConfig.CONFIG_ID },
      update: data,
      create: data,
    });

    // 상태 변경 시 캐시 무효화
    await this.cacheService.del(CACHE_CONFIG.CHARACTER.CONFIG);
  }
}
