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
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_ROOMS } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import {
  SOCKET_EVENT_TYPES,
  SocketFiatDepositRequestedPayload,
} from 'src/infrastructure/websocket/types/socket-payload.types';

interface CreateFiatDepositParams {
  user: AuthenticatedUser;
  payCurrency: string;
  amount: string | number;
  depositorName?: string;
  promotionId?: string;
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
    private readonly promotionsService: CheckEligiblePromotionsService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly depositRequirementPolicy: DepositRequirementPolicy,
    private readonly websocketService: WebsocketService,
    private readonly sqidsService: SqidsService,
  ) { }

  @Transactional()
  async execute(
    params: CreateFiatDepositParams,
  ): Promise<CreateFiatDepositResult> {
    const {
      user,
      payCurrency,
      amount,
      promotionId: encodedPromotionId,
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
    if (encodedPromotionId) {
      const decodedPromotionId = this.sqidsService.decode(encodedPromotionId, SqidsPrefix.PROMOTION);

      const eligiblePromotions = await this.promotionsService.execute({
        userId,
        depositAmount: new Prisma.Decimal(amount),
        currency: payCurrency as ExchangeCurrencyCode,
      });

      const selectedPromotion = eligiblePromotions.find(
        (p) => p.id === decodedPromotionId,
      );

      if (!selectedPromotion) {
        throw new InvalidPromotionSelectionException();
      }
      promotionId = selectedPromotion.id;
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

    // 나중에 텔레그램도 처리해야함.

    // 7. 도메인 엔티티 반환
    return {
      deposit: savedDeposit,
    };
  }
}
