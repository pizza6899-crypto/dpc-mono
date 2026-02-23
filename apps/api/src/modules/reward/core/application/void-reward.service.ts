import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { type IRewardRepository, REWARD_REPOSITORY } from '../ports/reward.repository.port';
import { UserReward } from '../domain/reward.entity';
import { MessageCode } from '@repo/shared';

export interface VoidRewardCommand {
    rewardId: bigint;
    reason?: string;
}

@Injectable()
export class VoidRewardService {
    constructor(
        @Inject(REWARD_REPOSITORY)
        private readonly rewardRepository: IRewardRepository,
    ) { }

    async execute(command: VoidRewardCommand): Promise<UserReward> {
        const reward = await this.rewardRepository.findById(command.rewardId);

        if (!reward) {
            throw new NotFoundException(MessageCode.REWARD_NOT_FOUND);
        }

        // 도메인 엔티티 내부에서 상태 전이 (VOIDED)
        // 이미 CLAIMED 상태라면 RewardAlreadyClaimedCannotVoidException을 던짐
        reward.markAsVoided(command.reason);

        // 변경된 상태를 영속화
        await this.rewardRepository.save(reward);

        return reward;
    }
}
