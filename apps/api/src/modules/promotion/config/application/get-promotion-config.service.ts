// src/modules/promotion/config/application/get-promotion-config.service.ts
import { Inject, Injectable } from '@nestjs/common';
import {
  PROMOTION_CONFIG_REPOSITORY,
  type PromotionConfigRepositoryPort,
} from '../ports/promotion-config.repository.port';
import { PromotionConfig } from '../domain/promotion-config.entity';

@Injectable()
export class GetPromotionConfigService {
  constructor(
    @Inject(PROMOTION_CONFIG_REPOSITORY)
    private readonly repository: PromotionConfigRepositoryPort,
  ) {}

  async execute(): Promise<PromotionConfig> {
    return await this.repository.get();
  }
}
