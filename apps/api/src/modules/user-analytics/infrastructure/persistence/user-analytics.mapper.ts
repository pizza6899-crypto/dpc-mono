import { UserGlobalTotalStats, UserGlobalHourlyStats } from '../../domain';
import {
    UserGlobalTotalStats as PrismaTotalStats,
    UserGlobalHourlyStats as PrismaHourlyStats,
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
     * Prisma -> Domain (Hourly)
     */
    toHourlyDomain(prismaModel: PrismaHourlyStats): UserGlobalHourlyStats {
        return UserGlobalHourlyStats.fromPersistence({
            userId: prismaModel.userId,
            hour: prismaModel.hour,
            ltvUsd: prismaModel.ltvUsd,
            ggrUsd: prismaModel.ggrUsd,
            ngrUsd: prismaModel.ngrUsd,
            hourlyDepositUsd: prismaModel.hourlyDepositUsd,
            hourlyWithdrawUsd: prismaModel.hourlyWithdrawUsd,
            hourlyBetUsd: prismaModel.hourlyBetUsd,
            hourlyWinUsd: prismaModel.hourlyWinUsd,
            hourlyPromoUsd: prismaModel.hourlyPromoUsd,
            updatedAt: prismaModel.updatedAt,
        });
    }
}
