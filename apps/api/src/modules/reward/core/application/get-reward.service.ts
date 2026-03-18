import { Inject, Injectable } from '@nestjs/common';
import { REWARD_REPOSITORY } from '../ports/reward.repository.port';
import type { IRewardRepository } from '../ports/reward.repository.port';
import { UserReward } from '../domain/reward.entity';

@Injectable()
export class GetRewardService {
    constructor(
        @Inject(REWARD_REPOSITORY)
        private readonly rewardRepository: IRewardRepository,
    ) { }

    async execute(id: bigint): Promise<UserReward | null> {
        return this.rewardRepository.findById(id);
    }
}
