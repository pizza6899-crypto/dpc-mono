import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ExchangeCurrencyCode,
  Prisma,
  CompTransactionType,
} from '@prisma/client';
import {
  COMP_CONFIG_REPOSITORY,
  COMP_REPOSITORY,
  COMP_DAILY_SETTLEMENT_REPOSITORY,
} from '../ports/repository.token';
import type {
  CompConfigRepositoryPort,
  CompDailySettlementRepositoryPort,
  CompRepositoryPort,
} from '../ports';
import {
  CompAccount,
  CompAccountTransaction,
  CompDailySettlement,
  CompPolicy,
  CompPolicyViolationException,
} from '../domain';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

interface EarnCompParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
  appliedRate: Prisma.Decimal; // Required for better tracking (e.g. 0.001 for 0.1%)
  referenceId?: bigint; // e.g. gameRoundId or transactionId
  description?: string;
  transactionType?: CompTransactionType;
  bypassPolicy?: boolean;
  processedBy?: bigint; // Admin User ID
}

@Injectable()
export class EarnCompService {
  private readonly logger = new Logger(EarnCompService.name);

  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
    @Inject(COMP_CONFIG_REPOSITORY)
    private readonly compConfigRepository: CompConfigRepositoryPort,
    @Inject(COMP_DAILY_SETTLEMENT_REPOSITORY)
    private readonly compDailySettlementRepository: CompDailySettlementRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly compPolicy: CompPolicy,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Transactional()
  async execute(params: EarnCompParams): Promise<CompAccount> {
    const {
      userId,
      currency,
      amount,
      appliedRate,
      referenceId,
      description,
      transactionType = CompTransactionType.EARN,
      bypassPolicy = false,
      processedBy,
    } = params;

    // 0. Acquire Lock for the user's comp account
    await this.advisoryLockService.acquireLock(
      LockNamespace.COMP_ACCOUNT,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 1. Check Configuration via Policy (if not bypassed)
    if (!bypassPolicy) {
      const config = await this.compConfigRepository.getConfig(currency);

      try {
        this.compPolicy.verifyEarn(config);
      } catch (error) {
        if (error instanceof CompPolicyViolationException) {
          this.logger.warn(`Comp earn skipped: ${error.message}`);
          // Return current account without changes
          const account = await this.compRepository.findByUserIdAndCurrency(
            userId,
            currency,
          );
          if (!account) return CompAccount.create({ userId, currency });
          return account;
        }
        throw error;
      }
    }

    // 2. Get or Create Account
    let account = await this.compRepository.findByUserIdAndCurrency(
      userId,
      currency,
    );
    if (!account) {
      account = CompAccount.create({ userId, currency });
    }

    // 3. Apply Earn Logic (Domain)
    account = account.earn(amount);

    // 4. Persist Account
    const savedAccount = await this.compRepository.save(account);

    // 5. Update Daily Settlement
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to UTC midnight

    let dailySettlement = await this.compDailySettlementRepository.findByUserIdAndCurrencyAndDate(
      userId,
      currency,
      today,
    );

    if (!dailySettlement) {
      dailySettlement = CompDailySettlement.create({
        userId,
        currency,
        date: today,
        totalEarned: amount,
      });
    } else {
      dailySettlement = dailySettlement.addEarn(amount);
    }

    await this.compDailySettlementRepository.save(dailySettlement);

    // 6. Record Transaction
    const transaction = CompAccountTransaction.create({
      id: this.snowflakeService.generate().id,
      compAccountId: savedAccount.id,
      amount: amount,
      appliedRate: appliedRate,
      type: transactionType,
      referenceId: referenceId,
      processedBy: processedBy,
      description,
    });
    await this.compRepository.createTransaction(transaction);

    this.logger.log(
      `Comp Earned: user=${userId}, amount=${amount}, rate=${appliedRate}, curr=${currency}, newTotalEarned=${savedAccount.totalEarned}`,
    );

    return savedAccount;
  }
}
