import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { Transactional } from '@nestjs-cls/transactional';
import {
  WageringRequirementNotFoundException,
  InvalidWageringStatusException,
  WageringNotForfeitableException,
} from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CreateWageringRequirementService } from './create-wagering-requirement.service';
import { GetWageringConfigService } from '../../config/application/get-wagering-config.service';
import { GetPromotionConfigService } from 'src/modules/promotion/config/application/get-promotion-config.service';

interface ForfeitWageringRequirementCommand {
  id: bigint;
  userId: bigint;
}

@Injectable()
export class ForfeitWageringRequirementService {
  private readonly logger = new Logger(ForfeitWageringRequirementService.name);

  constructor(
    @Inject(WAGERING_REQUIREMENT_REPOSITORY)
    private readonly repository: WageringRequirementRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
    private readonly createWageringService: CreateWageringRequirementService,
    private readonly promotionConfigService: GetPromotionConfigService,
  ) {}

  @Transactional()
  async execute(command: ForfeitWageringRequirementCommand): Promise<void> {
    const { id, userId } = command;

    const requirement = await this.repository.findById(id);
    if (!requirement || requirement.userId !== userId) {
      throw new WageringRequirementNotFoundException();
    }

    if (requirement.status !== 'ACTIVE') {
      throw new InvalidWageringStatusException(
        'Only active wagering requirements can be forfeited.',
      );
    }

    // 보안 정책: 기본 입금 롤링(DEPOSIT)은 사용자가 직접 포기할 수 없음 (AML 준수)
    if (requirement.sourceType === 'DEPOSIT') {
      throw new WageringNotForfeitableException();
    }

    const originalSourceType = requirement.sourceType;
    const depositId = requirement.appliedConfig?.depositId;
    const principalAmount = requirement.principalAmount;

    // 도메인 로직: 유저 요청에 의한 포기 처리
    requirement.cancel({
      reason: 'USER_FORFEIT',
      note: 'User voluntarily forfeited the bonus/wagering requirement.',
      cancelledBy: `USER:${userId}`,
    });

    await this.repository.save(requirement);

    // 정책: 프로모션 롤링을 포기할 때, 입금 원금에 대한 기본 롤링 조건이 없으면 새로 생성함
    if (
      originalSourceType === 'PROMOTION_BONUS' &&
      principalAmount.gt(0) &&
      depositId
    ) {
      const promotionConfig = await this.promotionConfigService.execute();
      await this.createWageringService.execute({
        userId,
        currency: requirement.currency,
        sourceType: 'DEPOSIT',
        sourceId: BigInt(depositId),
        targetType: 'AMOUNT',
        principalAmount: principalAmount,
        multiplier: promotionConfig.defaultAmlDepositMultiplier,
        bonusAmount: new Prisma.Decimal(0),
        initialFundAmount: principalAmount,
        realMoneyRatio: new Prisma.Decimal(1),
        isForfeitable: false,
        priority: 0,
      });
      this.logger.log(
        `Created replacement AML rolling for forfeited promotion: user ${userId}, deposit ${depositId}`,
      );
    }

    await this.dispatchLogService.dispatch({
      type: LogType.ACTIVITY,
      data: {
        userId: userId.toString(),
        category: 'WAGERING',
        action: 'FORFEIT_WAGERING_REQUIREMENT',
        metadata: {
          wageringId: id.toString(),
        },
      },
    });

    this.logger.log(`Wagering requirement ${id} forfeited by user ${userId}`);
  }
}
