// src/modules/deposit/application/create-fiat-deposit.service.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  Prisma,
  DepositMethodType,
  ExchangeCurrencyCode,
  PaymentProvider,
} from '@prisma/client';

import {
  DEPOSIT_DETAIL_REPOSITORY,
} from '../ports/out';
import type {
  DepositDetailRepositoryPort,
} from '../ports/out';
import {
  DepositDetail,
  DepositMethod,
  DepositAmount,
  PendingDepositExistsException,
  InvalidPromotionSelectionException,
} from '../domain';
import { DepositRequirementPolicy } from '../domain/policy/deposit-requirement.policy';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { CheckEligiblePromotionsService } from '../../promotion/application/check-eligible-promotions.service';
import { PROMOTION_REPOSITORY } from '../../promotion/ports/out';
import type { PromotionRepositoryPort } from '../../promotion/ports/out/promotion.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

interface CreateFiatDepositParams {
  user: AuthenticatedUser;
  payCurrency: string;
  amount: string | number;
  depositorName?: string;
  depositPromotionCode?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
}

interface CreateFiatDepositResult {
  deposit: DepositDetail;
}

@Injectable()
export class CreateFiatDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: PromotionRepositoryPort,
    private readonly promotionsService: CheckEligiblePromotionsService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly depositRequirementPolicy: DepositRequirementPolicy,
  ) { }

  @Transactional()
  async execute(
    params: CreateFiatDepositParams,
  ): Promise<CreateFiatDepositResult> {
    const {
      user,
      payCurrency,
      amount,
      depositPromotionCode,
      depositorName,
      ipAddress,
      deviceFingerprint,
    } = params;

    const userId = user.id;

    // 락 획득 (DB Advisory Lock)
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_DEPOSIT,
      userId.toString(),
      {
        throwThrottleError: true,
      },
    );

    // 0. 유저 상태 및 요구조건 검증 (Policy 적용 - 세션 정보 활용)
    this.depositRequirementPolicy.validateFiatRequirements(user);

    // 1. 중복 입금 신청 확인 (Pending 상태인 입금이 있으면 차단)
    const hasPendingDeposit =
      await this.depositRepository.existsPendingByUserId(userId);
    if (hasPendingDeposit) {
      throw new PendingDepositExistsException();
    }

    let promotionId: bigint | null = null;

    // 1. 프로모션 유효성 검사
    if (depositPromotionCode) {
      // 코드로 프로모션 조회
      const promotion =
        await this.promotionRepository.findByCode(depositPromotionCode);
      if (!promotion) {
        throw new InvalidPromotionSelectionException();
      }

      const eligiblePromotions = await this.promotionsService.execute({
        userId,
        depositAmount: new Prisma.Decimal(amount),
        currency: payCurrency as ExchangeCurrencyCode,
      });

      const isEligible = eligiblePromotions.some(
        (p) => p.code === depositPromotionCode,
      );
      if (!isEligible) {
        throw new InvalidPromotionSelectionException();
      }
      promotionId = promotion.id;
    }

    const decimalAmount = new Prisma.Decimal(amount);

    // 2. DepositMethod 생성
    const depositMethod = DepositMethod.create(
      DepositMethodType.BANK_TRANSFER,
      PaymentProvider.MANUAL,
    );

    // 3. DepositAmount 생성
    const depositAmount = DepositAmount.create({
      requestedAmount: decimalAmount,
    });

    // 4. DepositDetail 생성
    const depositDetail = DepositDetail.create({
      userId,
      depositCurrency: payCurrency as ExchangeCurrencyCode,
      method: depositMethod,
      amount: depositAmount,
      promotionId,
      depositorName,
      ipAddress,
      deviceFingerprint,
    });

    // 5. 저장
    const savedDeposit = await this.depositRepository.create(depositDetail);

    // 6. 도메인 엔티티 반환
    return {
      deposit: savedDeposit,
    };
  }
}
