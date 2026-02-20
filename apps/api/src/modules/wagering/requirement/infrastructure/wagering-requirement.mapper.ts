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
            targetType: prismaModel.targetType,

            requiredAmount: prismaModel.requiredAmount,
            wageredAmount: prismaModel.wageredAmount,
            requiredCount: prismaModel.requiredCount,
            wageredCount: prismaModel.wageredCount,

            isAutoCancelable: prismaModel.isAutoCancelable,

            principalAmount: prismaModel.principalAmount,
            multiplier: prismaModel.multiplier,
            bonusAmount: prismaModel.bonusAmount,
            initialFundAmount: prismaModel.initialFundAmount,

            currentBalance: prismaModel.currentBalance,
            totalBetAmount: prismaModel.totalBetAmount,
            totalWinAmount: prismaModel.totalWinAmount,

            realMoneyRatio: prismaModel.realMoneyRatio,
            isForfeitable: prismaModel.isForfeitable,

            parentWageringId: prismaModel.parentWageringId,
            appliedConfig: (prismaModel.appliedConfig as any) ?? {},
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
            targetType: domain.targetType,

            requiredAmount: domain.requiredAmount,
            wageredAmount: domain.wageredAmount,
            requiredCount: domain.requiredCount,
            wageredCount: domain.wageredCount,

            isAutoCancelable: domain.isAutoCancelable,

            principalAmount: domain.principalAmount,
            multiplier: domain.multiplier,
            bonusAmount: domain.bonusAmount,
            initialFundAmount: domain.initialFundAmount,

            currentBalance: domain.currentBalance,
            totalBetAmount: domain.totalBetAmount,
            totalWinAmount: domain.totalWinAmount,

            realMoneyRatio: domain.realMoneyRatio,
            isForfeitable: domain.isForfeitable,

            parentWageringId: domain.parentWageringId,
            appliedConfig: (domain.appliedConfig as any) ?? Prisma.JsonNull,
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
            wageredAmount: prismaLog.wageredAmount,
            createdAt: prismaLog.createdAt,
        });
    }
}
