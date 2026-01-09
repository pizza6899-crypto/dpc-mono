import { Injectable } from '@nestjs/common';
import { UserHourlyStat as PrismaUserHourlyStat } from '@repo/database';
import { UserHourlyStat } from '../domain/model/user-hourly-stat.entity';

@Injectable()
export class AnalyticsMapper {
    toDomain(model: PrismaUserHourlyStat): UserHourlyStat {
        return UserHourlyStat.rehydrate({
            userId: model.userId,
            currency: model.currency,
            date: model.date,
            totalDeposit: model.totalDeposit,
            totalWithdraw: model.totalWithdraw,
            depositCount: model.depositCount,
            withdrawCount: model.withdrawCount,
            totalBonusGiven: model.totalBonusGiven,
            totalBonusUsed: model.totalBonusUsed,
            totalBonusConverted: model.totalBonusConverted,
            totalBet: model.totalBet,
            totalWin: model.totalWin,
            netWin: model.netWin,
            ggr: model.ggr,
            totalGameCount: model.totalGameCount,
            slotBetAmount: model.slotBetAmount,
            slotWinAmount: model.slotWinAmount,
            slotGgr: model.slotGgr,
            slotGameCount: model.slotGameCount,
            liveBetAmount: model.liveBetAmount,
            liveWinAmount: model.liveWinAmount,
            liveGgr: model.liveGgr,
            liveGameCount: model.liveGameCount,
            totalCompEarned: model.totalCompEarned,
            totalCompConverted: model.totalCompConverted,
            totalCompDeducted: model.totalCompDeducted,
            startBalance: model.startBalance,
            endBalance: model.endBalance,
            startBonusBalance: model.startBonusBalance,
            endBonusBalance: model.endBonusBalance,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    toPrisma(entity: UserHourlyStat): PrismaUserHourlyStat {
        return {
            userId: entity.userId,
            currency: entity.currency,
            date: entity.date,
            totalDeposit: entity.totalDeposit,
            totalWithdraw: entity.totalWithdraw,
            depositCount: entity.depositCount,
            withdrawCount: entity.withdrawCount,
            totalBonusGiven: entity.totalBonusGiven,
            totalBonusUsed: entity.totalBonusUsed,
            totalBonusConverted: entity.totalBonusConverted,
            totalBet: entity.totalBet,
            totalWin: entity.totalWin,
            netWin: entity.netWin,
            ggr: entity.ggr,
            totalGameCount: entity.totalGameCount,
            slotBetAmount: entity.slotBetAmount,
            slotWinAmount: entity.slotWinAmount,
            slotGgr: entity.slotGgr,
            slotGameCount: entity.slotGameCount,
            liveBetAmount: entity.liveBetAmount,
            liveWinAmount: entity.liveWinAmount,
            liveGgr: entity.liveGgr,
            liveGameCount: entity.liveGameCount,
            totalCompEarned: entity.totalCompEarned,
            totalCompConverted: entity.totalCompConverted,
            totalCompDeducted: entity.totalCompDeducted,
            startBalance: entity.startBalance,
            endBalance: entity.endBalance,
            startBonusBalance: entity.startBonusBalance,
            endBonusBalance: entity.endBonusBalance,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
