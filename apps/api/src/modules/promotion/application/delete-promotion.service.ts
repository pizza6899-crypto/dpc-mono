// src/modules/promotion/application/delete-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Promotion, PromotionNotFoundException } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

@Injectable()
export class DeletePromotionService {
  private readonly logger = new Logger(DeletePromotionService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  @Transactional()
  async execute(id: bigint): Promise<void> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new PromotionNotFoundException(id);
    }

    if (promotion.isDeleted()) {
      this.logger.warn(`Promotion already deleted: id=${id}`);
      return;
    }

    // 소프트 삭제
    await this.repository.delete(id);

    this.logger.log(`Promotion soft deleted: id=${id}`);
  }
}

