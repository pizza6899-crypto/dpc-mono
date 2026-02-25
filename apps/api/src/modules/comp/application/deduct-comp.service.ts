import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ExchangeCurrencyCode,
  Prisma,
  CompTransactionType,
} from '@prisma/client';
import {
  COMP_REPOSITORY,
  COMP_CONFIG_REPOSITORY,
} from '../ports/repository.token';
import type { CompRepositoryPort, CompConfigRepositoryPort } from '../ports';
import {
  CompAccount,
  CompAccountTransaction,
  CompNotFoundException,
  CompPolicy,
} from '../domain';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

interface DeductCompParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
  description?: string;
  options?: {
    bypassPolicy?: boolean;
    processedBy?: bigint; // Admin User ID
  };
}

@Injectable()
export class DeductCompService {
  private readonly logger = new Logger(DeductCompService.name);

  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
    @Inject(COMP_CONFIG_REPOSITORY)
    private readonly compConfigRepository: CompConfigRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly compPolicy: CompPolicy,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Transactional()
  async execute(params: DeductCompParams): Promise<CompAccount> {
    const { userId, currency, amount, description } = params;

    // 0. Acquire Lock
    await this.advisoryLockService.acquireLock(
      LockNamespace.COMP_ACCOUNT,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 1. Get Account
    let account = await this.compRepository.findByUserIdAndCurrency(
      userId,
      currency,
    );
    if (!account) {
      throw new CompNotFoundException();
    }

    if (!params.options?.bypassPolicy) {
      // 2. Verify Policy
      this.compPolicy.verifyAdminAdjust(account);
    }

    // 3. Apply Deduct Logic (Domain)
    // Here we deduce it backwards, or using admin adjust logic
    account = account.adminAdjust(amount.negated());

    // 4. Persist
    const savedAccount = await this.compRepository.save(account);

    // 5. Record Transaction
    const transaction = CompAccountTransaction.create({
      id: this.snowflakeService.generate().id,
      compAccountId: savedAccount.id,
      amount: amount.negated(),
      type: CompTransactionType.ADMIN,
      processedBy: params.options?.processedBy,
      description: description || 'Admin Deduction',
    });
    await this.compRepository.createTransaction(transaction);

    this.logger.log(
      `Comp Deducted by Admin: user=${userId}, amount=${amount}, curr=${currency}, totalEarnedAfter=${savedAccount.totalEarned}`,
    );

    return savedAccount;
  }
}

