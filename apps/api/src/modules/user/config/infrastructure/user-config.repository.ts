import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserConfigRepositoryPort } from '../ports/out/user-config.repository.port';
import { UserConfig } from '../domain/model/user-config.entity';
import { UserConfigMapper } from './user-config.mapper';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class UserConfigRepository implements UserConfigRepositoryPort {
  private readonly CONFIG_ID = 1;

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) {}

  async findConfig(): Promise<UserConfig | null> {
    // L1 캐시 적용 (5초)
    const record = await this.cacheService.getOrSet(
      CACHE_CONFIG.USER_CONFIG.GLOBAL,
      async () => {
        return await this.tx.userConfig.findUnique({
          where: { id: this.CONFIG_ID },
        });
      },
    );

    return record ? UserConfigMapper.toDomain(record) : null;
  }

  async save(userConfig: UserConfig): Promise<void> {
    const data = UserConfigMapper.toPersistence(userConfig);

    await this.tx.userConfig.update({
      where: { id: this.CONFIG_ID },
      data,
    });

    // 저장 시 캐시 무효화
    await this.cacheService.del(CACHE_CONFIG.USER_CONFIG.GLOBAL);
  }
}
