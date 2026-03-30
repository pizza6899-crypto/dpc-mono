// src/modules/deposit/application/create-crypto-deposit.service.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  Prisma,
  DepositMethodType,
  ExchangeCurrencyCode,
  PaymentProvider,
} from '@prisma/client';

import { DEPOSIT_DETAIL_REPOSITORY } from '../ports';
import type { DepositDetailRepositoryPort } from '../ports';
import {
  DepositDetail,
  DepositMethod,
  DepositAmount,
  InvalidPromotionSelectionException,
} from '../domain';
import { DepositRequirementPolicy } from '../domain/policy/deposit-requirement.policy';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { ValidatePromotionEligibilityService } from '../../promotion/campaign/application/validate-promotion-eligibility.service';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';

interface CreateCryptoDepositParams {
  user: AuthenticatedUser;
  payCurrency: string;
  payNetwork: string;
  amount?: string | number;
  promotionId?: bigint;
  ipAddress?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class CreateCryptoDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly validatePromotionService: ValidatePromotionEligibilityService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly depositRequirementPolicy: DepositRequirementPolicy,
  ) {}

  @Transactional()
  async execute(params: CreateCryptoDepositParams): Promise<DepositDetail> {
    const {
      user,
      payCurrency,
      payNetwork,
      amount,
      promotionId: requestedPromotionId,
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

    // 0. 유저 상태 및 요구조건 검증 (Policy 적용)
    const hasPendingDeposit =
      await this.depositRepository.hasInProgressByUserId(userId);

    this.depositRequirementPolicy.validateCryptoRequirements({
      ...user,
      hasPendingDeposit,
    });

    let promotionId: bigint | null = null;

    // 1. 프로모션 유효성 검사
    if (requestedPromotionId) {
      try {
        await this.validatePromotionService.execute({
          userId,
          promotionId: requestedPromotionId,
          depositAmount: amount
            ? new Prisma.Decimal(amount)
            : new Prisma.Decimal(0),
          currency: payCurrency as ExchangeCurrencyCode,
        });
        promotionId = requestedPromotionId;
      } catch (error) {
        throw new InvalidPromotionSelectionException(error.message);
      }
    }

    // TODO: 주소 생성 로직 (Wallet Module 연동 필요)
    const walletAddress: string | undefined = undefined;

    // 2. DepositMethod 생성
    const depositMethod = DepositMethod.create(
      DepositMethodType.CRYPTO_WALLET,
      PaymentProvider.MANUAL,
    );

    // 3. DepositAmount 생성
    const depositAmount = DepositAmount.create({
      requestedAmount: amount
        ? new Prisma.Decimal(amount)
        : new Prisma.Decimal(0),
    });

    // 4. DepositDetail 생성
    const depositDetail = DepositDetail.create({
      userId,
      depositCurrency: payCurrency as ExchangeCurrencyCode,
      method: depositMethod,
      amount: depositAmount,
      promotionId,
      walletAddress,
      depositNetwork: payNetwork,
      ipAddress,
      deviceFingerprint,
    });

    // 5. 저장 및 반환
    return await this.depositRepository.create(depositDetail);
  }
}
