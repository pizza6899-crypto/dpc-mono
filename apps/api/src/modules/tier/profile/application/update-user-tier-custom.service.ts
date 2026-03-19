import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { Prisma } from '@prisma/client';
import { UserTierNotFoundException } from '../domain/tier-profile.exception';

export interface UpdateUserTierCustomCommand {
  customCompRate?: number | null;
  customWeeklyLossbackRate?: number | null;
  customMonthlyLossbackRate?: number | null;
  customDailyWithdrawalLimitUsd?: number | null;
  customWeeklyWithdrawalLimitUsd?: number | null;
  customMonthlyWithdrawalLimitUsd?: number | null;
  isCustomWithdrawalUnlimited?: boolean | null;
  isCustomDedicatedManager?: boolean | null;
  note?: string | null;
}

@Injectable()
export class UpdateUserTierCustomService {
  constructor(private readonly userTierRepository: UserTierRepositoryPort) {}

  async execute(
    userId: bigint,
    command: UpdateUserTierCustomCommand,
  ): Promise<void> {
    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier) {
      throw new UserTierNotFoundException();
    }

    if (command.customCompRate !== undefined)
      userTier.customCompRate =
        command.customCompRate !== null
          ? new Prisma.Decimal(command.customCompRate)
          : null;
    if (command.customWeeklyLossbackRate !== undefined)
      userTier.customWeeklyLossbackRate =
        command.customWeeklyLossbackRate !== null
          ? new Prisma.Decimal(command.customWeeklyLossbackRate)
          : null;
    if (command.customMonthlyLossbackRate !== undefined)
      userTier.customMonthlyLossbackRate =
        command.customMonthlyLossbackRate !== null
          ? new Prisma.Decimal(command.customMonthlyLossbackRate)
          : null;
    if (command.customDailyWithdrawalLimitUsd !== undefined)
      userTier.customDailyWithdrawalLimitUsd =
        command.customDailyWithdrawalLimitUsd !== null
          ? new Prisma.Decimal(command.customDailyWithdrawalLimitUsd)
          : null;
    if (command.customWeeklyWithdrawalLimitUsd !== undefined)
      userTier.customWeeklyWithdrawalLimitUsd =
        command.customWeeklyWithdrawalLimitUsd !== null
          ? new Prisma.Decimal(command.customWeeklyWithdrawalLimitUsd)
          : null;
    if (command.customMonthlyWithdrawalLimitUsd !== undefined)
      userTier.customMonthlyWithdrawalLimitUsd =
        command.customMonthlyWithdrawalLimitUsd !== null
          ? new Prisma.Decimal(command.customMonthlyWithdrawalLimitUsd)
          : null;
    if (command.isCustomWithdrawalUnlimited !== undefined)
      userTier.isCustomWithdrawalUnlimited =
        command.isCustomWithdrawalUnlimited;
    if (command.isCustomDedicatedManager !== undefined)
      userTier.isCustomDedicatedManager = command.isCustomDedicatedManager;
    if (command.note !== undefined) userTier.note = command.note;

    await this.userTierRepository.save(userTier);
  }
}
