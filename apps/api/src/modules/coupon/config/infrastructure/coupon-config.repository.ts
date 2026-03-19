import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CouponConfigRepositoryPort } from '../ports/coupon-config.repository.port';
import { CouponConfig } from '../domain/coupon-config.entity';
import { CouponConfigMapper } from './coupon-config.mapper';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class CouponConfigRepository implements CouponConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) {}

  async find(): Promise<CouponConfig | null> {
    const singletonId = CouponConfig.SINGLETON_ID;

    // 1. 캐시에서 먼저 조회
    const cached = await this.cacheService.get<any>(CACHE_CONFIG.COUPON.CONFIG);
    if (cached) {
      // 캐시 데이터(JSON)의 날짜와 BigInt 타입을 복원합니다.
      return CouponConfig.fromPersistence({
        ...cached,
        updatedAt: new Date(cached.updatedAt),
        updatedBy: cached.updatedBy ? BigInt(cached.updatedBy) : null,
      });
    }

    // 2. 캐시 없으면 DB 조회
    const config = await this.tx.couponConfig.findUnique({
      where: { id: singletonId },
    });

    if (!config) {
      return null;
    }

    const domain = CouponConfigMapper.toDomain(config);

    // 3. 캐시 저장 (Plain object로 저장)
    await this.cacheService.set(CACHE_CONFIG.COUPON.CONFIG, domain.toProps());

    return domain;
  }

  async update(config: CouponConfig): Promise<void> {
    const data = CouponConfigMapper.toPrisma(config);

    // 1. DB 업데이트
    await this.tx.couponConfig.update({
      where: { id: CouponConfig.SINGLETON_ID },
      data,
    });

    // 2. 캐시 무효화 (Set 대신 Del)
    // 트랜잭션 중이라면 커밋 전까지는 DB값이 확정되지 않으므로,
    // 캐시를 아예 없애버리는 것이 데이터 불일치를 방지하는 가장 안전한 방법입니다.
    await this.cacheService.del(CACHE_CONFIG.COUPON.CONFIG);
  }
}
