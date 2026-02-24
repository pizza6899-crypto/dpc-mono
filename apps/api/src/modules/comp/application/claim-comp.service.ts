import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ExchangeCurrencyCode,
  Prisma,
  CompTransactionType,
  CompClaimStatus,
  RewardSourceType,
  RewardItemType,
  WageringTargetType,
} from '@prisma/client';
import {
  COMP_REPOSITORY,
  COMP_CONFIG_REPOSITORY,
  COMP_CLAIM_HISTORY_REPOSITORY,
} from '../ports/repository.token';
import type {
  CompRepositoryPort,
  CompConfigRepositoryPort,
  CompClaimHistoryRepositoryPort,
} from '../ports';
import {
  CompTransaction,
  InsufficientCompBalanceException,
  CompClaimHistory,
  CompPolicy,
} from '../domain';
import { GrantRewardService } from '../../reward/core/application/grant-reward.service';
import { ClaimRewardService } from '../../reward/core/application/claim-reward.service';
import { FindUserWalletService } from '../../wallet/application/find-user-wallet.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

interface ClaimCompParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  amount: Prisma.Decimal;
}

interface ClaimCompResult {
  claimedAmount: Prisma.Decimal;
  newCompBalance: Prisma.Decimal;
  newCashBalance: Prisma.Decimal;
}

@Injectable()
export class ClaimCompService {
  private readonly logger = new Logger(ClaimCompService.name);

  constructor(
    @Inject(COMP_REPOSITORY)
    private readonly compRepository: CompRepositoryPort,
    @Inject(COMP_CONFIG_REPOSITORY)
    private readonly compConfigRepository: CompConfigRepositoryPort,
    @Inject(COMP_CLAIM_HISTORY_REPOSITORY)
    private readonly compClaimHistoryRepository: CompClaimHistoryRepositoryPort,
    private readonly findUserWalletService: FindUserWalletService,
    private readonly grantRewardService: GrantRewardService,
    private readonly claimRewardService: ClaimRewardService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly compPolicy: CompPolicy,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Transactional()
  async execute(params: ClaimCompParams): Promise<ClaimCompResult> {
    const { userId, currency, amount } = params;

    // 0. Acquire Lock
    await this.advisoryLockService.acquireLock(
      LockNamespace.COMP_WALLET,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 1. Check Configuration
    // 1. Get Wallet
    let wallet = await this.compRepository.findByUserIdAndCurrency(
      userId,
      currency,
    );
    if (!wallet) {
      throw new InsufficientCompBalanceException(
        userId,
        amount.toString(),
        '0',
      );
    }

    // 2. Check Policy via Domain Service
    const config = await this.compConfigRepository.getConfig(currency);
    this.compPolicy.verifyClaim(config, wallet, amount);

    const balanceBefore = wallet.balance;

    // 3. Apply Claim Logic (Domain)
    wallet = wallet.claim(amount);

    // 4. Persist Wallet
    const savedCompWallet = await this.compRepository.save(wallet);

    // 5. Record Comp Transaction
    const compTx = CompTransaction.create({
      id: this.snowflakeService.generate().id,
      compWalletId: savedCompWallet.id,
      amount: amount.negated(),
      balanceBefore: balanceBefore,
      balanceAfter: savedCompWallet.balance,
      appliedRate: new Prisma.Decimal(1), // ExchangeRate for Comp->Currency
      type: CompTransactionType.CLAIM,
      description: 'Comp conversion to cash',
    });
    const createdCompTx = await this.compRepository.createTransaction(compTx);

    // 6. Create Pending Claim History (Receipt)
    let claimHistory = CompClaimHistory.create({
      userId,
      compWalletTransactionId: createdCompTx.id,
      compAmount: amount,
      compCurrency: currency,
      targetAmount: amount, // 1:1 conversion assumed for now
      targetCurrency: currency,
      exchangeRate: new Prisma.Decimal(1),
      status: CompClaimStatus.PENDING,
    });
    claimHistory = await this.compClaimHistoryRepository.save(claimHistory);

    try {
      // 7. 리워드 모듈에 캐시/보너스 전환 스펙 전송 (Reward Grant)
      const grantedReward = await this.grantRewardService.execute({
        userId,
        sourceType: RewardSourceType.COMP_REWARD,
        sourceId: createdCompTx.id,
        rewardType: RewardItemType.BONUS_MONEY,
        currency,
        amount,
        wageringTargetType: WageringTargetType.AMOUNT,
        wageringMultiplier: new Prisma.Decimal(0), // 기본적으로 콤프는 롤링 없는 현금. 비율이 필요하면 정책값 파싱 연동 가능
        isForfeitable: false,
        reason: 'Comp points conversion via Reward Module',
      });

      // 8. 콤프 즉시 전환 옵션이므로 원스텝 수령 처리 (Reward Claim)
      await this.claimRewardService.execute({
        userId,
        rewardId: grantedReward.id,
      });

      // 9. 콤프 히스토리 완료 처리
      claimHistory = claimHistory.complete(grantedReward.id); // 리워드 ID 매핑
      await this.compClaimHistoryRepository.save(claimHistory);

      // 최신 유저 캐시 잔고 확인 (반환용)
      const walletAfter = await this.findUserWalletService.findWallet(userId, currency);

      this.logger.log(
        `Comp successfully delegated to Reward: user=${userId}, compDeducted=${amount}`,
      );

      return {
        claimedAmount: amount,
        newCompBalance: savedCompWallet.balance,
        newCashBalance: walletAfter?.cash ?? new Prisma.Decimal(0),
      };
    } catch (error) {
      // Mark history as FAILED
      claimHistory = claimHistory.fail(error.message);
      await this.compClaimHistoryRepository.save(claimHistory);
      throw error;
    }
  }
}
