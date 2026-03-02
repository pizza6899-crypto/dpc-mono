// src/modules/reward/infrastructure/reward.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { IRewardRepository } from '../ports/reward.repository.port';
import { UserReward } from '../domain/reward.entity';
import { RewardMapper } from './reward.mapper';
import { RewardStatus } from '@prisma/client';

@Injectable()
export class RewardRepository implements IRewardRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async findById(id: bigint): Promise<UserReward | null> {
    const model = await this.tx.userReward.findUnique({
      where: { id },
    });

    return model ? RewardMapper.toDomain(model) : null;
  }

  async findByUserIdAndStatus(
    userId: bigint,
    status: RewardStatus,
  ): Promise<UserReward[]> {
    const models = await this.tx.userReward.findMany({
      where: { userId, status },
      orderBy: { createdAt: 'desc' }, // 최근 보상부터 조회
    });

    return models.map((m) => RewardMapper.toDomain(m));
  }

  async findPendingRewardsPastExpiry(limit: number): Promise<UserReward[]> {
    const models = await this.tx.userReward.findMany({
      where: {
        status: RewardStatus.PENDING,
        expiresAt: { lt: new Date() }, // 현재 시간 기준 만료된 데이터만
      },
      take: limit,
    });

    return models.map((m) => RewardMapper.toDomain(m));
  }

  async save(reward: UserReward): Promise<UserReward> {
    const data = RewardMapper.toPersistence(reward);

    // Prisma Native Upsert 사용 (ID가 명시적으로 존재하므로 원자성 보장됨)
    const model = await this.tx.userReward.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });

    return RewardMapper.toDomain(model);
  }
}
