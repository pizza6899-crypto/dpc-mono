// src/modules/promotion/application/toggle-promotion-active.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Promotion, PromotionNotFoundException } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

@Injectable()
export class TogglePromotionActiveService {
  private readonly logger = new Logger(TogglePromotionActiveService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  @Transactional()
  async execute(id: bigint): Promise<Promotion> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new PromotionNotFoundException(id);
    }

    promotion.toggleActive();
    const updated = await this.repository.update(promotion);

    this.logger.log(
      `Promotion ${id} ${updated.isActive ? 'activated' : 'deactivated'}`,
    );

    return updated;
  }
}

