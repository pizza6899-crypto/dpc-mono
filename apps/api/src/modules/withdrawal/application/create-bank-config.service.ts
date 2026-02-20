import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import {
  BankWithdrawConfig,
  BankWithdrawConfigAlreadyExistsException,
} from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface CreateBankConfigParams {
  currency: ExchangeCurrencyCode;
  bankName: string;
  isActive: boolean;
  minWithdrawAmount: string;
  maxWithdrawAmount?: string;
  withdrawFeeFixed: string;
  withdrawFeeRate: string;
  description?: string;
  notes?: string;
}

@Injectable()
export class CreateBankConfigService {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly repository: WithdrawalRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  async execute(params: CreateBankConfigParams): Promise<BankWithdrawConfig> {
    // 이미 존재하는지 확인 (currency + bankName) - 삭제된 것 포함
    const existing = await this.repository.findBankConfigByCurrencyAndName(
      params.currency,
      params.bankName,
      true, // includeDeleted
    );

    if (existing) {
      // 삭제되지 않은 데이터가 있으면 중복 에러
      if (!existing.props.deletedAt) {
        throw new BankWithdrawConfigAlreadyExistsException(
          params.currency,
          params.bankName,
        );
      }

      // 삭제된 데이터가 있으면 복구 후 업데이트
      existing.restore();
      existing.update({
        isActive: params.isActive,
        minWithdrawAmount: new Prisma.Decimal(params.minWithdrawAmount),
        maxWithdrawAmount: params.maxWithdrawAmount
          ? new Prisma.Decimal(params.maxWithdrawAmount)
          : null,
        withdrawFeeFixed: new Prisma.Decimal(params.withdrawFeeFixed),
        withdrawFeeRate: new Prisma.Decimal(params.withdrawFeeRate),
        description: params.description ?? null,
        notes: params.notes ?? null,
      });
      return await this.repository.saveBankConfig(existing);
    }

    // 데이터가 전혀 없으면 신규 생성
    const { id } = this.snowflakeService.generate();
    const config = BankWithdrawConfig.createNew(id, {
      currency: params.currency,
      bankName: params.bankName,
      isActive: params.isActive,
      minWithdrawAmount: new Prisma.Decimal(params.minWithdrawAmount),
      maxWithdrawAmount: params.maxWithdrawAmount
        ? new Prisma.Decimal(params.maxWithdrawAmount)
        : null,
      withdrawFeeFixed: new Prisma.Decimal(params.withdrawFeeFixed),
      withdrawFeeRate: new Prisma.Decimal(params.withdrawFeeRate),
      description: params.description ?? null,
      notes: params.notes ?? null,
    });

    return await this.repository.saveBankConfig(config);
  }
}
