import { UserGlobalTotalStats, UserGlobalDailyStats } from '../../domain';
import {
    UserGlobalTotalStats as PrismaTotalStats,
    UserGlobalDailyStats as PrismaDailyStats,
} from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserAnalyticsMapper {
    /**
     * Prisma -> Domain (Total)
     */
    toTotalDomain(prismaModel: PrismaTotalStats): UserGlobalTotalStats {
        return UserGlobalTotalStats.fromPersistence({
            userId: prismaModel.userId,
            ltvUsd: prismaModel.ltvUsd,
            ggrUsd: prismaModel.ggrUsd,
            ngrUsd: prismaModel.ngrUsd,
            totalDepositUsd: prismaModel.totalDepositUsd,
            totalWithdrawUsd: prismaModel.totalWithdrawUsd,
            totalBetUsd: prismaModel.totalBetUsd,
            totalWinUsd: prismaModel.totalWinUsd,
            totalPromoUsd: prismaModel.totalPromoUsd,
            updatedAt: prismaModel.updatedAt,
        });
    }

    /**
     * Prisma -> Domain (Daily)
     */
    toDailyDomain(prismaModel: PrismaDailyStats): UserGlobalDailyStats {
        return UserGlobalDailyStats.fromPersistence({
            userId: prismaModel.userId,
            date: prismaModel.date,
            ltvUsd: prismaModel.ltvUsd,
            ggrUsd: prismaModel.ggrUsd,
            ngrUsd: prismaModel.ngrUsd,
            dailyDepositUsd: prismaModel.dailyDepositUsd,
            dailyWithdrawUsd: prismaModel.dailyWithdrawUsd,
            dailyBetUsd: prismaModel.dailyBetUsd,
            dailyWinUsd: prismaModel.dailyWinUsd,
            dailyPromoUsd: prismaModel.dailyPromoUsd,
            updatedAt: prismaModel.updatedAt,
        });
    }
}
