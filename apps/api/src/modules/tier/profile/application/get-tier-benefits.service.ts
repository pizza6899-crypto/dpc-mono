import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { EffectiveBenefits } from '../domain/user-tier.entity';

@Injectable()
export class GetTierBenefitsService {
  constructor(private readonly userTierRepository: UserTierRepositoryPort) {}

  async execute(userId: bigint): Promise<EffectiveBenefits | null> {
    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier) return null;

    // Effective Benefits 계산 로직은 엔티티에 캡슐화되어 있음
    return userTier.getEffectiveBenefits();
  }
}
