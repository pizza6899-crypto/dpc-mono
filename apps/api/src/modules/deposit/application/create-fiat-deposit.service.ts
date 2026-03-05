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
import { SendAlertService } from '../../notification/alert/application/send-alert.service';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_TARGET_GROUPS,
} from '../../notification/common';
import { ChannelType } from '@prisma/client';

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
    private readonly sendAlertService: SendAlertService,
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

    // 6. 어드민 알림 발송 (동기적 처리)
    try {
      await this.sendAdminNotifications(savedDeposit, user);
    } catch (err) {
      // 알림 실패가 입금 신청 자체에 영향을 주지 않도록 로깅만 수행
      console.error('Failed to send admin notifications for deposit:', err);
    }

    // 7. 도메인 엔티티 반환
    return {
      deposit: savedDeposit,
    };
  }

  /**
   * 어드민에게 입금 신청 알림을 발송합니다.
   */
  private async sendAdminNotifications(
    deposit: DepositDetail,
    user: AuthenticatedUser,
  ): Promise<void> {
    const payload = {
      id: deposit.id!.toString(),
      amount: deposit.getAmount().requestedAmount.toString(),
      currency: deposit.depositCurrency,
      depositorName: deposit.depositorName || 'N/A',
      userId: deposit.userId.toString(),
      email: user.email || 'N/A',
      nickname: user.nickname,
      requestedAt: deposit.createdAt.toISOString(),
    };

    // 2. 알림 로그 생성 및 발송 (DB 저장 + 실시간 팝업 브로드캐스트)
    await this.sendAlertService.execute({
      event: NOTIFICATION_EVENTS.FIAT_DEPOSIT_REQUESTED,
      targetGroup: NOTIFICATION_TARGET_GROUPS.ADMIN,
      payload,
      channels: [ChannelType.INBOX, ChannelType.WEBSOCKET, ChannelType.TELEGRAM], // 관리자 인박스 + 실시간 팝업
    });
  }
}
