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
    } = params;

    // 0. Early Exit for zero or negative amounts
    if (amount.lte(0)) {
      this.logger.warn(`Comp earn skipped: amount is <= 0 (${amount})`);
      const account = await this.compRepository.findByUserIdAndCurrency(userId, currency);
      return account ?? CompAccount.create({ userId, currency });
    }

    // 1. Acquire Lock for the user's comp account
    await this.advisoryLockService.acquireLock(
      LockNamespace.COMP_ACCOUNT,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 2. Fetch or Create Daily Settlement (Early fetch to check daily limits)
    // Apply UTC+9 (JST/KST) offset to align the daily bucket strictly to 00:00 KST
    const now = new Date();
    const kstOffsetMs = 9 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + kstOffsetMs);
    today.setUTCHours(0, 0, 0, 0); // Normalize to UTC midnight representing KST Date

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
        totalEarned: new Prisma.Decimal(0),
      });
    }

    let actualAmount = amount;

    // 3. Check Configuration via Policy
    const config = await this.compConfigRepository.getConfig(currency);

    try {
      this.compPolicy.verifyEarn(config);
    } catch (error) {
      if (error instanceof CompPolicyViolationException) {
        this.logger.warn(`Comp earn skipped: ${error.message}`);
        const account = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        return account ?? CompAccount.create({ userId, currency });
      }
      throw error;
    }

    // 4. Enforce maxDailyEarnPerUser limit
    if (config && config.maxDailyEarnPerUser.gt(0)) {
      const remainingDailyLimit = config.maxDailyEarnPerUser.sub(dailySettlement.totalEarned);

      if (remainingDailyLimit.lte(0)) {
        this.logger.warn(`Comp earn skipped: User reached the max daily limit (${config.maxDailyEarnPerUser})`);
        const account = await this.compRepository.findByUserIdAndCurrency(userId, currency);
        return account ?? CompAccount.create({ userId, currency });
      }

      if (actualAmount.gt(remainingDailyLimit)) {
        this.logger.log(`Comp earn amount capped: original=${actualAmount}, capped=${remainingDailyLimit}`);
        actualAmount = remainingDailyLimit;
      }
    }

    // 5. Get or Create Account
    let account = await this.compRepository.findByUserIdAndCurrency(userId, currency);
    if (!account) {
      account = CompAccount.create({ userId, currency });
    }

    // 6. Apply Earn Logic (Domain)
    try {
      account = account.earn(actualAmount);
    } catch (error) {
      if (error instanceof CompPolicyViolationException) {
        this.logger.warn(`Comp earn failed for user ${userId}: ${error.message}`);
        return account; // Return current state (skip earn)
      }
      throw error;
    }
    const savedAccount = await this.compRepository.save(account);

    // 7. Update Daily Settlement
    dailySettlement = dailySettlement.addEarn(actualAmount);
    await this.compDailySettlementRepository.save(dailySettlement);

    // 8. Record Transaction
    const sf = this.snowflakeService.generate();
    const transaction = CompAccountTransaction.create({
      id: sf.id,
      compAccountId: savedAccount.id,
      amount: actualAmount,
      appliedRate: appliedRate,
      type: CompTransactionType.EARN,
      referenceId: referenceId,
      createdAt: sf.timestamp,
    });
    await this.compRepository.createTransaction(transaction);

    this.logger.log(
      `Comp Earned: user=${userId}, original_amount=${amount}, actual_amount=${actualAmount}, rate=${appliedRate}, curr=${currency}, newTotalEarned=${savedAccount.totalEarned}`,
    );

    return savedAccount;
  }
}
