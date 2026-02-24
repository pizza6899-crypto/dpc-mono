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
  CompWallet,
  CompTransaction,
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
  async execute(params: DeductCompParams): Promise<CompWallet> {
    const { userId, currency, amount, description } = params;

    // 0. Acquire Lock
    await this.advisoryLockService.acquireLock(
      LockNamespace.COMP_WALLET,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 1. Get Wallet
    let wallet = await this.compRepository.findByUserIdAndCurrency(
      userId,
      currency,
    );
    if (!wallet) {
      throw new CompNotFoundException();
    }

    const config = await this.compConfigRepository.getConfig(currency);

    if (!params.options?.bypassPolicy) {
      // 2. Verify Policy
      this.compPolicy.verifyDeduct(config, wallet, amount);
    }

    // 3. Apply Deduct Logic (Domain)
    const balanceBefore = wallet.balance;
    const allowNegative = config?.allowNegativeBalance ?? true;
    wallet = wallet.deduct(amount, { allowNegative });

    // 3. Persist Wallet
    const savedWallet = await this.compRepository.save(wallet);

    // 4. Record Transaction
    const transaction = CompTransaction.create({
      id: this.snowflakeService.generate().id,
      compWalletId: savedWallet.id,
      amount: amount.negated(),
      balanceBefore: balanceBefore,
      balanceAfter: savedWallet.balance,
      appliedRate: new Prisma.Decimal(1),
      type: CompTransactionType.ADMIN,
      processedBy: params.options?.processedBy,
      description: description || 'Admin Deduction',
    });
    await this.compRepository.createTransaction(transaction);

    this.logger.log(
      `Comp Deducted by Admin: user=${userId}, amount=${amount}, curr=${currency}, newBal=${savedWallet.balance}`,
    );

    return savedWallet;
  }
}
