// src/modules/reward/core/application/instant-grant-reward.service.ts
import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import { GrantRewardService, GrantRewardCommand } from './grant-reward.service';
import { ClaimRewardService } from './claim-reward.service';
import { UserReward } from '../domain/reward.entity';

export interface InstantGrantRewardCommand extends GrantRewardCommand {
  /**
   * 보너스와 함께 처리되어야 할 원금(입금액 등).
   * 롤링 계산 시Principal + Amount 가 합산되어 사용됩니다.
   */
  principalAmount?: Prisma.Decimal;
}

@Injectable()
export class InstantGrantRewardService {
  constructor(
    private readonly grantRewardService: GrantRewardService,
    private readonly claimRewardService: ClaimRewardService,
  ) { }

  /**
   * 보상을 발급함과 동시에 즉시 수령(Claim) 처리합니다.
   * 입금 보너스처럼 조건 충족 시 즉시 지급되어야 하는 경우에 사용합니다.
   */
  @Transactional()
  async execute(command: InstantGrantRewardCommand): Promise<UserReward> {
    // 1. 보상 생성 (PENDING)
    const reward = await this.grantRewardService.execute(command);

    // 2. 즉시 수령 처리 (PENDING -> CLAIMED)
    // 이 과정에서 Wallet 업데이트와 Wagering 생성이 수행됩니다.
    // 입금 보너스의 경우 원금(Principal) 정보가 포함되어야 하므로 metadata 등으로 전달하거나
    // ClaimRewardService를 보완하여 처리할 수 있습니다.
    
    // TODO: ClaimRewardService가 principalAmount를 인식하도록 보완이 필요할 수 있습니다.
    // 현재는 단순 연쇄 호출로 구조를 잡습니다.
    await this.claimRewardService.execute({
      userId: command.userId,
      rewardId: reward.id,
    });

    return reward;
  }
}
