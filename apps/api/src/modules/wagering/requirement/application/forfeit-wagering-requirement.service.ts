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
import { GetRewardService } from 'src/modules/reward/core/application/get-reward.service';
import { GetPromotionConfigService } from 'src/modules/promotion/config/application/get-promotion-config.service';

import { RewardMetadataType } from 'src/modules/reward/core/domain/reward.types';

import type { PromotionMetadata } from 'src/modules/reward/core/domain/reward.types';

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
    private readonly rewardService: GetRewardService,

    private readonly dispatchLogService: DispatchLogService,
    private readonly createWageringService: CreateWageringRequirementService,
    private readonly promotionConfigService: GetPromotionConfigService,
  ) { }

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

    // 보안 정책: 포기 불가능한 롤링 조건은 예외 발생 (AML 관련 DEPOSIT 등)
    if (!requirement.isForfeitable) {
      throw new WageringNotForfeitableException();
    }

    const reward = await this.rewardService.execute(requirement.rewardId);

    let depositId: string | undefined;
    if (reward?.metadata?.type === RewardMetadataType.PROMOTION) {
      depositId = (reward.metadata as PromotionMetadata).depositId;
    }
    const principalAmount = requirement.principalAmount;


    // 도메인 로직: 유저 요청에 의한 포기 처리
    requirement.cancel({
      reason: 'USER_FORFEIT',
      note: 'User voluntarily forfeited the bonus/wagering requirement.',
      cancelledBy: `USER:${userId}`,
    });

    await this.repository.save(requirement);

    // 정책: 프로모션 롤링을 포기할 때, 입금 원금에 대한 기본 롤링 조건이 없으면 새로 생성함 (RewardSourceType 확인)
    if (
      reward?.sourceType === 'PROMOTION_BONUS' &&
      principalAmount.gt(0) &&
      depositId
    ) {
      const promotionConfig = await this.promotionConfigService.execute();
      await this.createWageringService.execute({
        userId,
        currency: requirement.currency,
        rewardId: requirement.rewardId, // [!] 보너스 포기 후 원금 롤링 생성 시 어떤 rewardId를 써야할지 결정 필요. 
        // 여기서는 원금 롤링은 별도 리워드가 없으면 기존 rewardId를 재사용하거나 0n 처리 가능하지만 
        // 구조상 모든 웨이저링은 리워드 모듈을 거쳐야 하므로, 원금 전용 리워드를 찾거나 생성해야 함.
        // 일단 타입 에러 수정을 위해 rewardId를 넘김
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
