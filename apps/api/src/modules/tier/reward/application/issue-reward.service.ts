import { Injectable } from '@nestjs/common';
import {
  TierRewardRepositoryPort,
  CreateTierRewardProps,
} from '../infrastructure/tier-reward.repository.port';
import { TierReward } from '../domain/tier-reward.entity';

@Injectable()
export class IssueRewardService {
  constructor(private readonly rewardRepository: TierRewardRepositoryPort) {}

  async execute(props: CreateTierRewardProps): Promise<TierReward> {
    return this.rewardRepository.create(props);
  }
}
