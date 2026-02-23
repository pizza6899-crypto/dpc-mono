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
    ) { }

    async findById(id: bigint): Promise<UserReward | null> {
        const model = await this.tx.userReward.findUnique({
            where: { id },
        });

        return model ? RewardMapper.toDomain(model) : null;
    }

    async findByUserIdAndStatus(userId: bigint, status: RewardStatus): Promise<UserReward[]> {
        const models = await this.tx.userReward.findMany({
            where: { userId, status },
            orderBy: { createdAt: 'desc' }, // 최근 보상부터 조회
        });

        return models.map(m => RewardMapper.toDomain(m));
    }

    async findPendingRewardsPastExpiry(limit: number): Promise<UserReward[]> {
        const models = await this.tx.userReward.findMany({
            where: {
                status: RewardStatus.PENDING,
                expiresAt: { lt: new Date() }, // 현재 시간 기준 만료된 데이터만
            },
            take: limit,
        });

        return models.map(m => RewardMapper.toDomain(m));
    }

    async save(reward: UserReward): Promise<UserReward> {
        const data = RewardMapper.toPersistence(reward);

        // 업데이트 또는 생성을 위한 upsert 패턴 적용 혹은 명시적 생성/업데이트
        // 일반적으로 Snowflake ID를 할당하여 생성하므로, 존재 여부 체크 후 create/update 분기
        const existing = await this.tx.userReward.count({ where: { id: data.id } });

        let model;
        if (existing > 0) {
            model = await this.tx.userReward.update({
                where: { id: data.id },
                data,
            });
        } else {
            model = await this.tx.userReward.create({
                data,
            });
        }

        return RewardMapper.toDomain(model);
    }

    async saveMany(rewards: UserReward[]): Promise<UserReward[]> {
        // 일괄 생성 (복잡한 에러 처리는 편의상 생략)
        const dataArray = rewards.map(r => RewardMapper.toPersistence(r));
        await this.tx.userReward.createMany({
            data: dataArray,
        });

        return rewards; // 생성의 경우 원본 배열 그대로 리턴
    }
}
