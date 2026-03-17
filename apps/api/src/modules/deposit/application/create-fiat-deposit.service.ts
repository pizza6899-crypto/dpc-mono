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
  InvalidPromotionSelectionException,
} from '../domain';
import { DepositRequirementPolicy } from '../domain/policy/deposit-requirement.policy';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { PromotionPolicy, PromotionNotFoundException } from '../../promotion/domain';
import { PROMOTION_REPOSITORY } from '../../promotion/ports';
import type { PromotionRepositoryPort } from '../../promotion/ports/promotion.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_ROOMS } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import {
  SOCKET_EVENT_TYPES,
} from 'src/infrastructure/websocket/types/socket-payload.types';

interface CreateFiatDepositParams {
  user: AuthenticatedUser;
  payCurrency: string;
  amount: string | number;
  depositorName?: string;
  promotionId?: bigint;
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
    private readonly promotionPolicy: PromotionPolicy,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly depositRequirementPolicy: DepositRequirementPolicy,
    private readonly websocketService: WebsocketService,
  ) { }

  @Transactional()
  async execute(
    params: CreateFiatDepositParams,
  ): Promise<CreateFiatDepositResult> {
    const {
      user,
      payCurrency,
      amount,
      promotionId: requestedPromotionId,
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

    // 0. 유저 상태 및 요구조건 검증 (Policy 적용)
    const hasPendingDeposit =
      await this.depositRepository.hasInProgressByUserId(userId);

    this.depositRequirementPolicy.validateFiatRequirements({
      ...user,
      hasPendingDeposit,
    });

    let promotionId: bigint | null = null;

    // 1. 프로모션 유효성 검사
    if (requestedPromotionId) {
      const promotion = await this.promotionRepository.findById(requestedPromotionId);
      if (!promotion) {
        throw new PromotionNotFoundException();
      }

      const currencyRule = await this.promotionRepository.getCurrencyRule(
        requestedPromotionId,
        payCurrency as ExchangeCurrencyCode,
      );

      if (!currencyRule) {
        throw new InvalidPromotionSelectionException('Currency not supported for this promotion');
      }

      const hasPreviousDeposits = await this.promotionRepository.hasPreviousDeposits(userId);
      const userParticipations = await this.promotionRepository.findUserPromotions(userId, 'ACTIVE');

      // 도메인 정책을 통한 통합 검증
      try {
        this.promotionPolicy.validateEligibility(
          promotion,
          currencyRule,
          new Prisma.Decimal(amount),
          hasPreviousDeposits,
          userParticipations,
        );
        promotionId = requestedPromotionId;
      } catch (error) {
        throw new InvalidPromotionSelectionException(error.message);
      }
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

    // 6. 어드민 실시간 알림 발송 (Socket Only)
    this.websocketService.sendToRoom(
      SOCKET_ROOMS.ADMIN,
      SOCKET_EVENT_TYPES.FIAT_DEPOSIT_REQUESTED,
      {
        id: savedDeposit.id!.toString(),
        depositorName: savedDeposit.depositorName!,
        amount: savedDeposit.getAmount().requestedAmount.toString(),
        currency: savedDeposit.depositCurrency,
        requestedAt: savedDeposit.createdAt.toISOString(),
      },
    );

    // 7. 도메인 엔티티 반환
    return {
      deposit: savedDeposit,
    };
  }
}
