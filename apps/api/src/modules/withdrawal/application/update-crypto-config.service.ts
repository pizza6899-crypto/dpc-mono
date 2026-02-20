import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CryptoWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface UpdateCryptoConfigParams {
  id: bigint;
  isActive?: boolean;
  minWithdrawAmount?: string;
  maxWithdrawAmount?: string | null; // null to remove limit
  autoProcessLimit?: string | null;
  withdrawFeeFixed?: string;
  withdrawFeeRate?: string;
}

@Injectable()
export class UpdateCryptoConfigService {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
  ) {}

  async execute(
    params: UpdateCryptoConfigParams,
  ): Promise<CryptoWithdrawConfig> {
    const config = await this.repository.getCryptoConfigById(params.id);

    const updates: any = {};
    if (params.isActive !== undefined) updates.isActive = params.isActive;
    if (params.minWithdrawAmount)
      updates.minWithdrawAmount = new Prisma.Decimal(params.minWithdrawAmount);
    if (params.maxWithdrawAmount !== undefined)
      updates.maxWithdrawAmount = params.maxWithdrawAmount
        ? new Prisma.Decimal(params.maxWithdrawAmount)
        : null;
    if (params.autoProcessLimit !== undefined)
      updates.autoProcessLimit = params.autoProcessLimit
        ? new Prisma.Decimal(params.autoProcessLimit)
        : null;
    if (params.withdrawFeeFixed)
      updates.withdrawFeeFixed = new Prisma.Decimal(params.withdrawFeeFixed);
    if (params.withdrawFeeRate)
      updates.withdrawFeeRate = new Prisma.Decimal(params.withdrawFeeRate);

    config.update(updates);

    return await this.repository.saveCryptoConfig(config);
  }
}
