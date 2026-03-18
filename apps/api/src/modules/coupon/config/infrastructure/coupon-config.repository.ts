import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CouponConfigRepositoryPort } from '../ports/coupon-config.repository.port';
import { CouponConfig } from '../domain/coupon-config.entity';
import { CouponConfigMapper } from './coupon-config.mapper';

@Injectable()
export class CouponConfigRepository implements CouponConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) { }

  async find(): Promise<CouponConfig> {
    const singletonId = CouponConfig.SINGLETON_ID;

    // Singleton 패턴으로 ID 1번만 사용
    const config = await this.tx.couponConfig.upsert({
      where: { id: singletonId },
      update: {},
      create: {
        id: singletonId,
        isCouponEnabled: true,
        maxDailyAttemptsPerUser: 10,
        defaultExpiryDays: 30
      },
    });
    return CouponConfigMapper.toDomain(config);
  }

  async update(config: CouponConfig): Promise<void> {
    const data = CouponConfigMapper.toPrisma(config);
    await this.tx.couponConfig.update({
      where: { id: CouponConfig.SINGLETON_ID },
      data,
    });
  }
}
