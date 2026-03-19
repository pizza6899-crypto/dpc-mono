// src/modules/reward/ports/reward.repository.port.ts
import { UserReward } from '../domain/reward.entity';
import { RewardStatus } from '@prisma/client';

export const REWARD_REPOSITORY = Symbol('REWARD_REPOSITORY');

export interface IRewardRepository {
  // 단건 조회
  findById(id: bigint): Promise<UserReward | null>;

  // 복수 조회 (User 기준)
  findByUserIdAndStatus(
    userId: bigint,
    status: RewardStatus,
  ): Promise<UserReward[]>;

  // 만료 대기건 조회 등 폴링 스케줄러 관련
  findPendingRewardsPastExpiry(limit: number): Promise<UserReward[]>;

  // 영속성 관리
  save(reward: UserReward): Promise<UserReward>;
}
