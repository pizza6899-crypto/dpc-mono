import { Inject, Injectable, Logger } from '@nestjs/common';
import { WageringRequirement, WageringPolicy } from '../domain';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { Prisma } from '@prisma/client';
import type {
  ExchangeCurrencyCode,
  WageringSourceType,
  WageringTargetType,
  WageringCalculationMethod,
} from '@prisma/client';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import type { RequestClientInfo } from 'src/common/http/types';
import { GetWageringConfigService } from '../../config/application/get-wagering-config.service';
import { GetPromotionConfigService } from 'src/modules/promotion/config/application/get-promotion-config.service';
import { DateTime } from 'luxon';
import { Transactional } from '@nestjs-cls/transactional';
import { WageringAppliedConfig } from '../domain/wagering-applied-config';

interface CreateWageringRequirementCommand {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  rewardId: bigint;
  calculationMethod?: WageringCalculationMethod;
  targetType: WageringTargetType;
  principalAmount: Prisma.Decimal;
  multiplier: Prisma.Decimal;
  bonusAmount: Prisma.Decimal;
  initialFundAmount: Prisma.Decimal;
  realMoneyRatio: Prisma.Decimal;
  requiredCount?: number;
  isForfeitable?: boolean;
  parentWageringId?: bigint;
  priority?: number;
  expiresAt?: Date;
  appliedConfig?: WageringAppliedConfig;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class CreateWageringRequirementService {
  private readonly logger = new Logger(CreateWageringRequirementService.name);

  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly repository: WageringRequirementRepositoryPort,
    private readonly policy: WageringPolicy,
    private readonly getConfigService: GetWageringConfigService,
    private readonly getPromotionConfigService: GetPromotionConfigService,
    private readonly dispatchLogService: DispatchLogService,
  ) { }

  @Transactional()
  async execute(
    command: CreateWageringRequirementCommand,
  ): Promise<WageringRequirement> {
    const {
      userId,
      currency,
      rewardId,
      calculationMethod,
      targetType,
      principalAmount,
      multiplier,
      bonusAmount,
      initialFundAmount,
      realMoneyRatio,
      requiredCount = 0,
      isForfeitable = false,
      parentWageringId,
      priority = 0,
      expiresAt,
      appliedConfig,
      requestInfo,
    } = command;

    // 1. 중복 생성 방지 (Idempotency)
    const existing = await this.repository.findLatestByReward(userId, rewardId);
    if (existing) {
      this.logger.warn(
        `Wagering requirement already exists for user ${userId}, reward ${rewardId}. Skipping creation.`,
      );
      return existing;
    }

    // 2. 비즈니스 정책 검증 (Domain Policy)
    this.policy.validateCreation({ principalAmount, bonusAmount, multiplier });

    // 0. 글로벌 설정 조회
    const [config, promotionConfig] = await Promise.all([
      this.getConfigService.execute(),
      this.getPromotionConfigService.execute(),
    ]);

    // 3. 목표 금액 계산
    const requiredAmount = principalAmount.add(bonusAmount).mul(multiplier);

    // 2. 설정 보정
    const setting = config.getSetting(currency);
    const finalExpiresAt =
      command.expiresAt ??
      DateTime.now()
        .plus({ days: promotionConfig.defaultBonusExpiryDays })
        .toJSDate();

    this.logger.log(
      `Creating wagering requirement for user ${userId}, targetType ${targetType}, principal ${principalAmount} (x${multiplier}), bonus ${bonusAmount}`,
    );

    // Create using factory method
    const wageringRequirement = WageringRequirement.create({
      userId,
      currency,
      rewardId,
      calculationMethod,
      targetType,
      requiredAmount,
      requiredCount,
      principalAmount,
      multiplier,
      bonusAmount,
      initialFundAmount,
      realMoneyRatio,
      isForfeitable,
      parentWageringId: parentWageringId ?? null,
      priority,
      isAutoCancelable: true,
      expiresAt: finalExpiresAt,
      appliedConfig: {
        ...appliedConfig,
        snapshot: {
          defaultBonusExpiryDays: promotionConfig.defaultBonusExpiryDays,
          defaultDepositMultiplier:
            promotionConfig.defaultAmlDepositMultiplier.toString(),
          isWageringCheckEnabled: config.isWageringCheckEnabled,
          currencyThreshold: setting.cancellationThreshold.toString(),
          minBet: setting.minBetAmount,
          maxBet: setting.maxBetAmount,
          cancellationThreshold: setting.cancellationThreshold,
        },
      },
    });

    const created = await this.repository.create(wageringRequirement);

    // Explicit Audit Log Dispatch
    await this.dispatchLogService.dispatch(
      {
        type: LogType.ACTIVITY,
        data: {
          userId: userId.toString(),
          category: 'WAGERING',
          action: 'CREATE_WAGERING_REQUIREMENT',
          metadata: {
            wageringId: created.id.toString(),
            rewardId: rewardId.toString(),
            targetType,
            principalAmount: principalAmount.toString(),
            multiplier: multiplier.toString(),
            requiredAmount: requiredAmount.toString(),
            bonusAmount: bonusAmount.toString(),
            initialFundAmount: initialFundAmount.toString(),
            currency,
          },
        },
      },
      command.requestInfo,
    );

    return created;
  }
}
