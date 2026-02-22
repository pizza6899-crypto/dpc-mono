// src/modules/reward/infrastructure/reward.mapper.ts
import { Prisma, UserReward as PrismaUserReward } from '@prisma/client';
import { UserReward, UserRewardProps } from '../domain/reward.entity';
import { RewardMetadata } from '../domain/reward.types';
import Decimal from 'decimal.js';

export class RewardMapper {
    /**
     * Prisma DB 모델을 도메인 Entity로 변환 (Type-Safe JSON 대응)
     */
    static toDomain(prismaModel: PrismaUserReward): UserReward {
        const props: UserRewardProps = {
            id: prismaModel.id,
            userId: prismaModel.userId,
            sourceType: prismaModel.sourceType,
            sourceId: prismaModel.sourceId,

            rewardType: prismaModel.rewardType,
            currency: prismaModel.currency,
            amount: new Decimal(prismaModel.amount),

            wageringTargetType: prismaModel.wageringTargetType,
            wageringMultiplier: prismaModel.wageringMultiplier ? new Decimal(prismaModel.wageringMultiplier) : null,
            wageringExpiryDays: prismaModel.wageringExpiryDays,
            maxCashConversion: prismaModel.maxCashConversion ? new Decimal(prismaModel.maxCashConversion) : null,
            isForfeitable: prismaModel.isForfeitable,

            status: prismaModel.status,
            expiresAt: prismaModel.expiresAt,
            claimedAt: prismaModel.claimedAt,

            reason: prismaModel.reason,
            // JSON으로 저장된 필드를 애플리케이션의 엄격한 타입으로 강제 단언(Assertion)
            metadata: prismaModel.metadata as RewardMetadata | null,

            createdAt: prismaModel.createdAt,
            updatedAt: prismaModel.updatedAt,
        };

        return new UserReward(props);
    }

    /**
     * 도메인 Entity를 Prisma 저장용 객체로 변환
     */
    static toPersistence(entity: UserReward): any {
        const props = entity.toSnapshot();

        return {
            id: props.id,
            userId: props.userId,
            sourceType: props.sourceType,
            sourceId: props.sourceId,

            rewardType: props.rewardType,
            currency: props.currency,
            amount: props.amount as any, // Prisma Decimal 호환을 위해 any로 바이패스 또는 Prisma.Decimal 래퍼 사용

            wageringTargetType: props.wageringTargetType,
            wageringMultiplier: props.wageringMultiplier as any,
            wageringExpiryDays: props.wageringExpiryDays,
            maxCashConversion: props.maxCashConversion as any,
            isForfeitable: props.isForfeitable,

            status: props.status,
            expiresAt: props.expiresAt,
            claimedAt: props.claimedAt,

            reason: props.reason,
            metadata: props.metadata ? (props.metadata as any) : Prisma.DbNull,

            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
        } as any; // 전체를 any로 묶어 Prisma Input과의 호환 문제를 한 번에 바이패스 (Domain mapper의 역할에 충실)
    }
}
