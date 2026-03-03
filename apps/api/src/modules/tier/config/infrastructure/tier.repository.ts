import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Tier } from '../domain/tier.entity';
import { TierRepositoryPort, UpdateTierProps } from './tier.repository.port';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class TierRepository implements TierRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) { }

  async findAll(options?: { ignoreCache?: boolean }): Promise<Tier[]> {
    const fetcher = async () => {
      return await this.tx.tier.findMany({
        include: { translations: true, benefits: true },
        orderBy: { level: 'asc' },
      });
    };

    const records = options?.ignoreCache
      ? await fetcher()
      : await this.cacheService.getOrSet(CACHE_CONFIG.TIER.LIST, fetcher);

    return records.map((record) => Tier.fromPersistence(record));
  }

  async findByLevel(level: number): Promise<Tier | null> {
    const tiers = await this.findAll();
    return tiers.find((tier) => tier.level === level) || null;
  }

  async findByCode(code: string): Promise<Tier | null> {
    const tiers = await this.findAll();
    return tiers.find((tier) => tier.code === code) || null;
  }

  async findNextTierByLevel(level: number): Promise<Tier | null> {
    const tiers = await this.findAll();
    // findAll()은 이미 level ASC로 정렬되어 있으므로, 현재 level보다 큰 첫 번째 티어가 다음 티어임.
    return tiers.find((t) => t.level > level) || null;
  }

  async update(props: UpdateTierProps): Promise<Tier> {
    const { code, updatedBy, translations, ...data } = props;

    const current = await this.tx.tier.findUnique({ where: { code } });
    if (!current) {
      throw new Error(`Tier not found with code: ${code}`);
    }

    const tierId = current.id;

    const record = await this.tx.tier.update({
      where: { code },
      data: {
        ...data,
        updatedBy,
        translations: translations
          ? {
            upsert: translations.map((t) => ({
              where: {
                tierId_language: { tierId: tierId, language: t.language },
              },
              update: { name: t.name, description: t.description },
              create: {
                language: t.language,
                name: t.name,
                description: t.description,
              },
            })),
          }
          : undefined,
      },
      include: { translations: true, benefits: true },
    });

    const updated = Tier.fromPersistence(record);
    await this.cacheService.del(CACHE_CONFIG.TIER.LIST);
    return updated;
  }
}
