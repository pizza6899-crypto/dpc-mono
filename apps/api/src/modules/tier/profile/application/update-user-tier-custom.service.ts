import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UpdateUserTierCustomRequestDto } from '../controllers/admin/dto/user-tier-admin.request.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateUserTierCustomService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint, dto: UpdateUserTierCustomRequestDto): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            throw new NotFoundException('User tier info not found');
        }

        // Partial update logic - in TS entity we would usually have a setter or just update fields if they are public/mutable
        // In UserTier entity, fields are public.
        // We should handle 'undefined' vs 'null'. DTO optional fields are undefined if not sent.

        if (dto.customCompRate !== undefined) userTier.customCompRate = dto.customCompRate !== null ? new Prisma.Decimal(dto.customCompRate) : null;
        if (dto.customLossbackRate !== undefined) userTier.customLossbackRate = dto.customLossbackRate !== null ? new Prisma.Decimal(dto.customLossbackRate) : null;
        if (dto.customRakebackRate !== undefined) userTier.customRakebackRate = dto.customRakebackRate !== null ? new Prisma.Decimal(dto.customRakebackRate) : null;
        if (dto.customReloadBonusRate !== undefined) userTier.customReloadBonusRate = dto.customReloadBonusRate !== null ? new Prisma.Decimal(dto.customReloadBonusRate) : null;
        if (dto.customWithdrawalLimitUsd !== undefined) userTier.customWithdrawalLimitUsd = dto.customWithdrawalLimitUsd !== null ? new Prisma.Decimal(dto.customWithdrawalLimitUsd) : null;
        if (dto.isCustomWithdrawalUnlimited !== undefined) userTier.isCustomWithdrawalUnlimited = dto.isCustomWithdrawalUnlimited;
        if (dto.isCustomDedicatedManager !== undefined) userTier.isCustomDedicatedManager = dto.isCustomDedicatedManager;
        if (dto.isCustomVipEventEligible !== undefined) userTier.isCustomVipEventEligible = dto.isCustomVipEventEligible;

        await this.userTierRepository.save(userTier);
    }
}
