import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { PromotionConfig } from '../domain/promotion-config.entity';
import type { PromotionConfigRepositoryPort } from '../ports/promotion-config.repository.port';
import { PromotionConfigMapper } from './promotion-config.mapper';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { CACHE_CONFIG } from 'src/infrastructure/cache/cache.constants';
import { PromotionConfigNotFoundException } from '../../campaign/domain/promotion.exception';

@Injectable()
export class PromotionConfigRepository implements PromotionConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: PromotionConfigMapper,
    private readonly cacheService: CacheService,
  ) {}

  async get(): Promise<PromotionConfig> {
    return await this.cacheService.getOrSet(
      CACHE_CONFIG.PROMOTION.CONFIG,
      async () => {
        const config = await this.tx.promotionConfig.findFirst({
          where: { id: Number(PromotionConfig.SINGLETON_ID) },
        });

        if (!config) {
          throw new PromotionConfigNotFoundException();
        }

        return this.mapper.toDomain(config);
      },
    );
  }

  async update(config: PromotionConfig): Promise<PromotionConfig> {
    const data = this.mapper.toPrismaUpdate(config);
    const updated = await this.tx.promotionConfig.update({
      where: { id: Number(PromotionConfig.SINGLETON_ID) },
      data,
    });

    const domain = this.mapper.toDomain(updated);
    await this.cacheService.set(CACHE_CONFIG.PROMOTION.CONFIG, domain);
    return domain;
  }
}
