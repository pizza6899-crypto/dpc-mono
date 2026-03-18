import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable } from '@nestjs/common';
import { COUPON_CONFIG_REPOSITORY_TOKEN } from '../ports/coupon-config.repository.token';
import type { CouponConfigRepositoryPort } from '../ports/coupon-config.repository.port';
import { CouponConfig } from '../domain/coupon-config.entity';
import { CouponConfigNotFoundException } from '../domain/coupon-config.exception';

export interface UpdateCouponConfigCommand {
  isCouponEnabled?: boolean;
  maxDailyAttemptsPerUser?: number;
  defaultExpiryDays?: number;
  adminId: bigint;
}

@Injectable()
export class UpdateCouponConfigService {
  constructor(
    @Inject(COUPON_CONFIG_REPOSITORY_TOKEN)
    private readonly repository: CouponConfigRepositoryPort,
  ) { }

  @Transactional()
  async execute(command: UpdateCouponConfigCommand): Promise<CouponConfig> {
    const config = await this.repository.find();

    if (!config) {
      throw new CouponConfigNotFoundException();
    }

    config.update(
      {
        isCouponEnabled: command.isCouponEnabled,
        maxDailyAttemptsPerUser: command.maxDailyAttemptsPerUser,
        defaultExpiryDays: command.defaultExpiryDays,
      },
      command.adminId,
    );

    await this.repository.update(config);

    return config;
  }
}
