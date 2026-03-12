// src/modules/deposit/application/create-crypto-deposit.service.ts
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
} from '../domain';
import { DepositRequirementPolicy } from '../domain/policy/deposit-requirement.policy';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

interface CreateCryptoDepositParams {
  user: AuthenticatedUser;
  payCurrency: string;
  payNetwork: string;
  amount?: string | number;
  depositPromotionCode?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class CreateCryptoDepositService {
  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly depositRequirementPolicy: DepositRequirementPolicy,
  ) { }

  @Transactional()
  async execute(params: CreateCryptoDepositParams): Promise<DepositDetail> {
    const {
      user,
      payCurrency,
      payNetwork,
      amount,
      depositPromotionCode,
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
      walletAddress,
      depositNetwork: payNetwork,
      ipAddress,
      deviceFingerprint,
    });

    // 5. 저장 및 반환
    return await this.depositRepository.create(depositDetail);
  }
}
