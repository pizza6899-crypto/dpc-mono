import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { UserTier } from '../domain/user-tier.entity';
import { Prisma, UserTierStatus } from '@prisma/client';

@Injectable()
export class InitializeUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTier> {
        const existing = await this.userTierRepository.findByUserId(userId);
        if (existing) return existing;

        const allTiers = await this.tierRepository.findAll();
        const baseTier = allTiers[0]; // 보통 브론즈(Priority 1)
        if (!baseTier) throw new Error('Tier definitions missing');

        const newUserTier = new UserTier(
            0n, userId, baseTier.id,
            new Prisma.Decimal(0), new Prisma.Decimal(0), new Date(),
            baseTier.priority, UserTierStatus.ACTIVE, null, new Date(),
            null, null, null, null, null, null, null, null, // No overrides
            true, null, null,
            baseTier
        );

        return this.userTierRepository.save(newUserTier);
    }
}
