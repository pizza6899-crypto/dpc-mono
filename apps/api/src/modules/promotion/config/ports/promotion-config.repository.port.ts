// src/modules/promotion/config/ports/promotion-config.repository.port.ts
import { PromotionConfig } from '../domain/promotion-config.entity';

export const PROMOTION_CONFIG_REPOSITORY = Symbol('PROMOTION_CONFIG_REPOSITORY');

export interface PromotionConfigRepositoryPort {
  get(): Promise<PromotionConfig>;
  update(config: PromotionConfig): Promise<PromotionConfig>;
}
