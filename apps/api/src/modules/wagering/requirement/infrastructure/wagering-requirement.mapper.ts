import { Injectable } from '@nestjs/common';
import { WageringRequirement, WageringContributionLog } from '../domain';
import { Prisma } from '@prisma/client';
import type {
    WageringRequirement as PrismaWageringRequirement,
    WageringContributionLog as PrismaWageringContributionLog
} from '@prisma/client';

@Injectable()
export class WageringRequirementMapper {
    /**
     * Prisma 모델을 WageringRequirement 도메인 엔티티로 변환
     */
    toDomain(prismaModel: PrismaWageringRequirement): WageringRequirement {
        return WageringRequirement.fromPersistence({
            id: prismaModel.id,
            userId: prismaModel.userId,
            currency: prismaModel.currency,
            sourceType: prismaModel.sourceType,
            sourceId: prismaModel.sourceId,
            requiredAmount: prismaModel.requiredAmount,
            fulfilledAmount: prismaModel.fulfilledAmount,
            isAutoCancelable: prismaModel.isAutoCancelable,
            principalAmount: prismaModel.principalAmount,
            multiplier: prismaModel.multiplier,
            initialLockedAmount: prismaModel.initialLockedAmount,
            appliedConfig: prismaModel.appliedConfig,
            maxCashConversion: prismaModel.maxCashConversion,
            convertedAmount: prismaModel.convertedAmount,
            isPaused: prismaModel.isPaused,
            status: prismaModel.status,
            priority: prismaModel.priority,
            createdAt: prismaModel.createdAt,
            updatedAt: prismaModel.updatedAt,
            expiresAt: prismaModel.expiresAt,
            lastContributedAt: prismaModel.lastContributedAt,
            completedAt: prismaModel.completedAt,
            cancelledAt: prismaModel.cancelledAt,
            cancellationNote: prismaModel.cancellationNote,
            cancellationReasonType: prismaModel.cancellationReasonType,
            cancelledBy: prismaModel.cancelledBy,
            balanceAtCancellation: prismaModel.balanceAtCancellation,
            forfeitedAmount: prismaModel.forfeitedAmount,
        });
    }

    /**
     * WageringRequirement 도메인 엔티티를 Prisma 데이터 타입으로 변환
     */
    toPrisma(domain: WageringRequirement): Omit<PrismaWageringRequirement, 'createdAt' | 'updatedAt'> {
        return {
            id: domain.id,
            userId: domain.userId,
            currency: domain.currency,
            sourceType: domain.sourceType,
            sourceId: domain.sourceId,
            requiredAmount: domain.requiredAmount,
            fulfilledAmount: domain.fulfilledAmount,
            isAutoCancelable: domain.isAutoCancelable,
            principalAmount: domain.principalAmount,
            multiplier: domain.multiplier,
            initialLockedAmount: domain.initialLockedAmount,
            appliedConfig: (domain.appliedConfig ?? Prisma.JsonNull) as any,
            maxCashConversion: domain.maxCashConversion,
            convertedAmount: domain.convertedAmount,
            isPaused: domain.isPaused,
            status: domain.status,
            priority: domain.priority,
            expiresAt: domain.expiresAt,
            lastContributedAt: domain.lastContributedAt,
            completedAt: domain.completedAt,
            cancelledAt: domain.cancelledAt,
            cancellationNote: domain.cancellationNote,
            cancellationReasonType: domain.cancellationReasonType,
            cancelledBy: domain.cancelledBy,
            balanceAtCancellation: domain.balanceAtCancellation,
            forfeitedAmount: domain.forfeitedAmount,
        };
    }

    /**
     * Prisma 로그 모델을 WageringContributionLog 도메인 모델로 변환
     */
    toDomainLog(prismaLog: PrismaWageringContributionLog): WageringContributionLog {
        return WageringContributionLog.fromPersistence({
            id: prismaLog.id,
            wageringRequirementId: prismaLog.wageringRequirementId,
            gameRoundId: prismaLog.gameRoundId,
            requestAmount: prismaLog.requestAmount,
            contributionRate: prismaLog.contributionRate,
            contributedAmount: prismaLog.contributedAmount,
            createdAt: prismaLog.createdAt,
        });
    }
}
