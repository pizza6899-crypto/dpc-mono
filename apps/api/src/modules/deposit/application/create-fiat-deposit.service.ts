// src/modules/deposit/application/create-fiat-deposit.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InvalidPromotionSelectionException } from '../domain/deposit.exception';
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
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_ROOMS } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import {
  SOCKET_EVENT_TYPES,
} from 'src/infrastructure/websocket/types/socket-payload.types';

import { QUEST_ENGINE_PORT } from '../ports/out/quest-engine.port';
import type { QuestEnginePort } from '../ports/out/quest-engine.port';

interface CreateFiatDepositParams {
  user: AuthenticatedUser;
  payCurrency: string;
  amount: string | number;
  depositorName?: string;
  depositPromotionCode?: string; // Match DTO
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
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly depositRequirementPolicy: DepositRequirementPolicy,
    private readonly websocketService: WebsocketService,
    @Inject(QUEST_ENGINE_PORT)
    private readonly questEnginePort: QuestEnginePort,
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

    const appliedQuestId = depositPromotionCode;

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

    const decimalAmount = new Prisma.Decimal(amount);

    // --- (New) 퀘스트 유효성 검증 ---
    if (appliedQuestId) {
      const isEligible = await this.questEnginePort.validateQuestEligibility({
        userId,
        questId: BigInt(appliedQuestId),
        currency: payCurrency as ExchangeCurrencyCode,
        amount: decimalAmount,
      });

      if (!isEligible) {
        throw new InvalidPromotionSelectionException();
      }
    }

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
      depositorName,
      ipAddress,
      deviceFingerprint,
      providerMetadata: appliedQuestId ? { appliedQuestId } : null,
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
