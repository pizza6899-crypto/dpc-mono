import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from '../../../../infrastructure/prisma/prisma.module';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { CACHE_CONFIG } from '../../../../infrastructure/cache/cache.constants';
import { ArtifactDrawConfigRepositoryPort } from '../ports/artifact-draw-config.repository.port';
import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';
import { ArtifactDrawConfigMapper } from './artifact-draw-config.mapper';

@Injectable()
export class PrismaArtifactDrawConfigRepository implements ArtifactDrawConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: ArtifactDrawConfigMapper,
    private readonly cacheService: CacheService,
  ) { }

  async findAll(): Promise<ArtifactDrawConfig[]> {
    const rawList = await this.cacheService.getOrSet(
      CACHE_CONFIG.ARTIFACT.DRAW_CONFIG_LIST,
      async () => {
        const records = await this.tx.artifactDrawConfig.findMany();

        return records.map(r => JSON.parse(JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v)));
      },
    );

    return rawList.map((m) => this.mapper.toEntity(m));
  }

  async updateMany(configs: ArtifactDrawConfig[]): Promise<void> {
    for (const config of configs) {
      await this.tx.artifactDrawConfig.update({
        where: { grade: config.grade },
        data: {
          probability: config.probability,
          updatedAt: config.updatedAt,
        },
      });
    }

    await this.cacheService.del(CACHE_CONFIG.ARTIFACT.DRAW_CONFIG_LIST);
  }
}
