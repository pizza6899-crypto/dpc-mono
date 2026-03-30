// src/modules/reward/core/application/claim-reward.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';
import {
  type IRewardRepository,
  REWARD_REPOSITORY,
} from '../ports/reward.repository.port';
import { RewardNotFoundException } from '../domain/reward.exception';
import { Transactional } from '@nestjs-cls/transactional';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application/create-wagering-requirement.service';
import {
  Prisma,
  UserWalletBalanceType,
  UserWalletTransactionType,
  WageringSourceType,
  RewardSourceType,
  WageringCalculationMethod,
} from '@prisma/client';
import {
  UpdateOperation,
  WalletActionName,
} from 'src/modules/wallet/domain/wallet.constant';
import { RewardMetadataType } from '../domain/reward.types';

export interface ClaimRewardCommand {
  userId: bigint;
  rewardId: bigint;
}

@Injectable()
export class ClaimRewardService {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
    private readonly advisoryLockService: AdvisoryLockService,

    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly createWageringRequirementService: CreateWageringRequirementService,
  ) { }

  /**
   * 유저가 대기(PENDING) 중인 보상을 받기(Claim) 합니다.
   * 동시성 제어를 위해 트랜잭션 내부에서 DB Advisory Lock을 사용합니다.
   */
  @Transactional()
  async execute(command: ClaimRewardCommand): Promise<void> {
    // 1. 유저의 광클 어뷰징 방지를 위해 데이터베이스 기반 Advisory Lock 체결
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_REWARD,
      command.rewardId.toString(),
    );

    // 2. 보상 단건 조회 및 존재 판독
    const reward = await this.rewardRepository.findById(command.rewardId);

    if (!reward || reward.userId !== command.userId) {
      throw new RewardNotFoundException();
    }

    // 3. 도메인 엔티티 내부에서 수령 가능(CLAIMABLE) 상태 체크 및 상태 전이 (CLAIMED)
    reward.markAsClaimed();

    // Wagering 여부 판단: Multiplier가 존재하는가?
    const hasWagering =
      reward.wageringMultiplier && reward.wageringMultiplier.gt(0);
    const balanceType = hasWagering
      ? UserWalletBalanceType.BONUS
      : UserWalletBalanceType.CASH;

    let actionName: WalletActionName;
    let wageringSourceType: WageringSourceType =
      WageringSourceType.PROMOTION_BONUS; // Default

    switch (reward.sourceType) {
      case RewardSourceType.TIER_REWARD:
        actionName = WalletActionName.CLAIM_TIER_REWARD;
        wageringSourceType = WageringSourceType.TIER_BONUS;
        break;
      case RewardSourceType.COMP_REWARD:
        actionName = WalletActionName.CLAIM_COMP;
        wageringSourceType = WageringSourceType.PROMOTION_BONUS;
        break;
      case RewardSourceType.PROMOTION_BONUS:
        actionName = WalletActionName.APPROVE_DEPOSIT;
        wageringSourceType = WageringSourceType.PROMOTION_BONUS;
        break;
      case RewardSourceType.COUPON:
        actionName = WalletActionName.APPLY_COUPON_PROMOTION;
        wageringSourceType = WageringSourceType.COUPON;
        break;
      default:
        actionName = WalletActionName.GRANT_PROMOTION_BONUS;
        wageringSourceType = WageringSourceType.PROMOTION_BONUS;
        break;
    }

    // --- 입금 보너스 전용 처리 (원금 + 보너스 통합) ---
    let principalAmount = new Prisma.Decimal(0);
    let depositId: bigint | undefined = undefined;
    let calculationMethod: WageringCalculationMethod | undefined = undefined;

    if (reward.metadata?.type === RewardMetadataType.PROMOTION) {
      if (reward.metadata.depositAmount) {
        principalAmount = new Prisma.Decimal(reward.metadata.depositAmount);
      }
      if (reward.metadata.depositId) {
        depositId = BigInt(reward.metadata.depositId);
      }
      if (reward.metadata.wageringCalculationMethod) {
        calculationMethod = reward.metadata.wageringCalculationMethod;
      }
    }

    const totalAmount = new Prisma.Decimal(reward.amount.toString()).add(
      principalAmount,
    );
    const referenceId = depositId ?? reward.id;

    // A. 지갑(Wallet) 모듈에 '보너스 머니' 또는 '캐시' 충전 요청
    await this.updateUserBalanceService.updateBalance(
      {
        userId: reward.userId,
        currency: reward.currency,
        amount: totalAmount, // 통합 금액
        operation: UpdateOperation.ADD,
        balanceType: balanceType,
        transactionType: UserWalletTransactionType.DEPOSIT, // 입금 흐름으로 처리
        referenceId: referenceId,
      },
      {
        actionName,
        serviceName: 'RewardModule',
        metadata: {
          description: `Reward Claim: ${reward.sourceType}`,
          traceId: reward.id.toString(),
          depositId: depositId?.toString(),
          bonusAmount: reward.amount.toString(),
        },
      },
    );

    // B. (롤링 배수가 0이 아닐 경우) 롤링(Wagering) 모듈에 스펙 생성 요청
    if (hasWagering) {
      let expiresAt: Date | undefined = undefined;
      if (reward.wageringExpiryDays) {
        const now = new Date();
        expiresAt = new Date(
          now.getTime() + reward.wageringExpiryDays * 24 * 60 * 60 * 1000,
        );
      }

      await this.createWageringRequirementService.execute({
        userId: reward.userId,
        currency: reward.currency,
        rewardId: reward.id,
        targetType: reward.wageringTargetType,
        calculationMethod: calculationMethod,
        principalAmount: principalAmount, // 원금 전달
        multiplier: new Prisma.Decimal(reward.wageringMultiplier!.toString()),
        bonusAmount: new Prisma.Decimal(reward.amount.toString()),
        initialFundAmount: totalAmount, // 통합 초기 자금
        realMoneyRatio: totalAmount.isZero()
          ? new Prisma.Decimal(0)
          : principalAmount.div(totalAmount),
        isForfeitable: reward.isForfeitable,
        expiresAt,
      });
    }

    // C. 이 보상의 상태를 CLAIMED 로 DB에 확정 업데이트
    await this.rewardRepository.save(reward);
  }
}
