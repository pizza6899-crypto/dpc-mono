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
            // 안전한 Decimal 변환을 위해 toString()을 거친 후 주입
            amount: new Decimal(prismaModel.amount.toString()),

            wageringTargetType: prismaModel.wageringTargetType,
            wageringMultiplier: prismaModel.wageringMultiplier ? new Decimal(prismaModel.wageringMultiplier.toString()) : null,
            wageringExpiryDays: prismaModel.wageringExpiryDays,
            maxCashConversion: prismaModel.maxCashConversion ? new Decimal(prismaModel.maxCashConversion.toString()) : null,
            isForfeitable: prismaModel.isForfeitable,

            status: prismaModel.status,
            expiresAt: prismaModel.expiresAt,
            claimedAt: prismaModel.claimedAt,

            reason: prismaModel.reason,
            // JSON으로 저장된 필드를 애플리케이션의 엄격한 타입으로 강제 단언(Assertion)
            metadata: prismaModel.metadata ? (prismaModel.metadata as unknown as RewardMetadata) : null,

            createdAt: prismaModel.createdAt,
            updatedAt: prismaModel.updatedAt,
        };

        return new UserReward(props);
    }

    /**
     * 도메인 Entity를 Prisma 저장용 객체로 변환
     */
    static toPersistence(entity: UserReward): Prisma.UserRewardUncheckedCreateInput {
        const props = entity.toSnapshot();

        return {
            id: props.id,
            userId: props.userId,
            sourceType: props.sourceType,
            sourceId: props.sourceId,

            rewardType: props.rewardType,
            currency: props.currency,
            // string 타입 처리 시 Prisma Decimal 타입으로 내부에서 자동 파싱되므로 타입 오차 방지 가능
            amount: props.amount.toString(),

            wageringTargetType: props.wageringTargetType,
            wageringMultiplier: props.wageringMultiplier?.toString() ?? null,
            wageringExpiryDays: props.wageringExpiryDays,
            maxCashConversion: props.maxCashConversion?.toString() ?? null,
            isForfeitable: props.isForfeitable,

            status: props.status,
            expiresAt: props.expiresAt,
            claimedAt: props.claimedAt,

            reason: props.reason,
            metadata: props.metadata ? (props.metadata as unknown as Prisma.InputJsonValue) : Prisma.DbNull,

            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
        };
    }
}
