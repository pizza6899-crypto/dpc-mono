import { Injectable } from '@nestjs/common';
import { TierRewardRepositoryPort } from '../infrastructure/tier-reward.repository.port';
import { TierReward } from '../domain/tier-reward.entity';

@Injectable()
export class GetAvailableRewardsService {
    constructor(
        private readonly rewardRepository: TierRewardRepositoryPort,
    ) { }

    /**
     * 유저의 수령 대기 중인 보상 목록을 조회합니다.
     */
    async execute(userId: bigint): Promise<TierReward[]> {
        return this.rewardRepository.findPendingByUserId(userId);
    }
}
