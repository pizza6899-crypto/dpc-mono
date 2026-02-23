import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { TierRewardRepositoryPort } from '../infrastructure/tier-reward.repository.port';
import {
  RewardNotFoundException,
  RewardOwnerMismatchException,
  RewardNotPendingException,
  RewardExpiredException,
} from '../domain/tier-reward.exception';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application/create-wagering-requirement.service';
import {
  ExchangeCurrencyCode,
  UserWalletBalanceType,
  UserWalletTransactionType,
  Prisma,
} from '@prisma/client';
import { WalletActionName, UpdateOperation } from 'src/modules/wallet/domain';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class ClaimRewardService {
  private readonly logger = new Logger(ClaimRewardService.name);

  constructor(
    private readonly rewardRepository: TierRewardRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly updateBalanceService: UpdateUserBalanceService,
    private readonly createWageringService: CreateWageringRequirementService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Transactional()
  async execute(
    userId: bigint,
    rewardId: bigint,
    targetCurrency: ExchangeCurrencyCode = ExchangeCurrencyCode.USD,
  ): Promise<void> {
    // [Concurrency Control] 유저별 보상 청구 동시성 제어 (중복 클릭 방지)
    await this.advisoryLockService.acquireLock(
      LockNamespace.TIER_REWARD,
      userId.toString(),
    );

    const reward = await this.rewardRepository.findById(rewardId);

    if (!reward) throw new RewardNotFoundException();
    if (reward.userId !== userId) throw new RewardOwnerMismatchException();

    // 1. 사전 검증 및 환율 정보 계산
    if (!reward.isPending) throw new RewardNotPendingException(reward.status);
    if (reward.isExpired) throw new RewardExpiredException();

    const usdAmount = reward.bonusAmountUsd;
    let finalAmount = usdAmount;
    let exchangeRate = new Prisma.Decimal(1);

    if (targetCurrency !== ExchangeCurrencyCode.USD) {
      exchangeRate = await this.exchangeRateService.getRate({
        fromCurrency: ExchangeCurrencyCode.USD,
        toCurrency: targetCurrency,
      });
      finalAmount = usdAmount.mul(exchangeRate);
      this.logger.debug(
        `Converting reward ${rewardId} from ${usdAmount} USD to ${finalAmount} ${targetCurrency} (rate: ${exchangeRate})`,
      );
    }

    // 2. 지갑 지급 처리
    const isCash = reward.wageringMultiplier.isZero(); // 배율이 0이면 즉시 출금 가능한 캐시

    // Wallet 모듈 업데이트 시 생성될 Transaction ID를 미리 채번하여 양방향 참조 수립
    const walletTxId = this.snowflakeService.generate().id;

    await this.updateBalanceService.updateBalance(
      {
        userId,
        currency: targetCurrency,
        amount: finalAmount,
        operation: UpdateOperation.ADD,
        balanceType: isCash
          ? UserWalletBalanceType.CASH
          : UserWalletBalanceType.BONUS,
        transactionType: UserWalletTransactionType.BONUS_IN,
        txId: walletTxId, // 사전 채번된 트랜잭션 ID 명시적 할당
        referenceId: reward.id, // 핵심 추적 ID
        amountUsd: usdAmount,
      },
      {
        actionName: WalletActionName.CLAIM_TIER_REWARD,
        internalNote: `Tier Reward Claim: ${reward.fromLevel} -> ${reward.toLevel} (Converted to ${targetCurrency})`,
      },
    );

    // 3. 도메인 엔티티 상태 변경 (CLAIMED)
    reward.claim({
      walletTxId, // 사전 채번된 지갑 트랜잭션 ID 저장 (양방향 매핑 완료)
      currency: targetCurrency,
      amount: finalAmount,
      rate: exchangeRate,
    });

    // 4. 베팅 요구 조건 생성 (보너스인 경우)
    if (!isCash) {
      await this.createWageringService.execute({
        userId,
        currency: targetCurrency,
        sourceType: 'TIER_BONUS',
        sourceId: rewardId,
        targetType: 'AMOUNT',
        principalAmount: finalAmount,
        multiplier: reward.wageringMultiplier,
        bonusAmount: finalAmount,
        initialFundAmount: finalAmount,
        realMoneyRatio: new Prisma.Decimal(0),
        isForfeitable: true,
        expiresAt: undefined, // 롤링 만료 기간은 글로벌 정책에 따름 (reward.expiresAt 은 '보상 수령 기한'이므로 여기에 넣으면 안됨!)
      });
    }

    // 5. 최종 저장
    await this.rewardRepository.save(reward);

    this.logger.log(
      `User ${userId} claimed tier reward ${rewardId} amount=${finalAmount} ${targetCurrency} (isCash=${isCash})`,
    );
  }
}
