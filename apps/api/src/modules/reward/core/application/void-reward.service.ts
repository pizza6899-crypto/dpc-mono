import { Injectable, Inject } from '@nestjs/common';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';
import {
  type IRewardRepository,
  REWARD_REPOSITORY,
} from '../ports/reward.repository.port';
import { UserReward } from '../domain/reward.entity';
import { RewardNotFoundException } from '../domain/reward.exception';
import { Transactional } from '@nestjs-cls/transactional';

export interface VoidRewardCommand {
  rewardId: bigint;
  reason?: string;
}

@Injectable()
export class VoidRewardService {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  /**
   * 어드민 또는 시스템이 보상을 무효화(Void) 처리합니다.
   * 유저의 Claim 시도와의 레이스 컨디션을 막기 위해 DB Advisory Lock을 적용합니다.
   */
  @Transactional()
  async execute(command: VoidRewardCommand): Promise<UserReward> {
    // 1. 상태 변경 시 유저의 수령 요청과 충돌을 막기 위해 락 체결
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_REWARD,
      command.rewardId.toString(),
    );

    // 2. 단건 조회 (Transaction Context 내에서 안전하게 조회)
    const reward = await this.rewardRepository.findById(command.rewardId);

    if (!reward) {
      throw new RewardNotFoundException();
    }

    // 3. 도메인 엔티티 내부에서 상태 전이 (VOIDED)
    // PENDING 상태가 아니라면 RewardOnlyPendingCanVoidException을 던짐
    reward.markAsVoided(command.reason);

    // 4. 변경된 상태를 영속화
    await this.rewardRepository.save(reward);

    return reward;
  }
}
