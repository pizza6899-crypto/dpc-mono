import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { Prisma } from '@prisma/client';

export interface UpdateUserTierCustomCommand {
    customCompRate?: number;
    customLossbackRate?: number;
    customRakebackRate?: number;
    customReloadBonusRate?: number;
    customWithdrawalLimitUsd?: number;
    isCustomWithdrawalUnlimited?: boolean;
    isCustomDedicatedManager?: boolean;
    isCustomVipEventEligible?: boolean;
    note?: string;
}

@Injectable()
export class UpdateUserTierCustomService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint, command: UpdateUserTierCustomCommand): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            throw new NotFoundException('User tier info not found');
        }

        if (command.customCompRate !== undefined) userTier.customCompRate = command.customCompRate !== null ? new Prisma.Decimal(command.customCompRate) : null;
        if (command.customLossbackRate !== undefined) userTier.customLossbackRate = command.customLossbackRate !== null ? new Prisma.Decimal(command.customLossbackRate) : null;
        if (command.customRakebackRate !== undefined) userTier.customRakebackRate = command.customRakebackRate !== null ? new Prisma.Decimal(command.customRakebackRate) : null;
        if (command.customReloadBonusRate !== undefined) userTier.customReloadBonusRate = command.customReloadBonusRate !== null ? new Prisma.Decimal(command.customReloadBonusRate) : null;
        if (command.customWithdrawalLimitUsd !== undefined) userTier.customWithdrawalLimitUsd = command.customWithdrawalLimitUsd !== null ? new Prisma.Decimal(command.customWithdrawalLimitUsd) : null;
        if (command.isCustomWithdrawalUnlimited !== undefined) userTier.isCustomWithdrawalUnlimited = command.isCustomWithdrawalUnlimited;
        if (command.isCustomDedicatedManager !== undefined) userTier.isCustomDedicatedManager = command.isCustomDedicatedManager;
        if (command.isCustomVipEventEligible !== undefined) userTier.isCustomVipEventEligible = command.isCustomVipEventEligible;
        if (command.note !== undefined) userTier.note = command.note;

        await this.userTierRepository.save(userTier);
    }
}
