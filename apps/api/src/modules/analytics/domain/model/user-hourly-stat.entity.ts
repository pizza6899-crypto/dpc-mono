import { ExchangeCurrencyCode, Prisma } from '@repo/database';

export class UserHourlyStat {
    private constructor(
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
        public readonly date: Date,
        // --- 트랜잭션 집계 ---
        public totalDeposit: Prisma.Decimal,
        public totalWithdraw: Prisma.Decimal,
        public depositCount: number,
        public withdrawCount: number,
        // --- 보너스 집계 ---
        public totalBonusGiven: Prisma.Decimal,
        public totalBonusUsed: Prisma.Decimal,
        public totalBonusConverted: Prisma.Decimal,
        // --- 게임 활동 집계 (전체) ---
        public totalBet: Prisma.Decimal,
        public totalWin: Prisma.Decimal,
        public netWin: Prisma.Decimal,
        public ggr: Prisma.Decimal,
        public totalGameCount: number,
        // --- 게임 카테고리별 상세 집계 ---
        // 슬롯 (Slots)
        public slotBetAmount: Prisma.Decimal,
        public slotWinAmount: Prisma.Decimal,
        public slotGgr: Prisma.Decimal,
        public slotGameCount: number,
        // 라이브 카지노 (Live Casino)
        public liveBetAmount: Prisma.Decimal,
        public liveWinAmount: Prisma.Decimal,
        public liveGgr: Prisma.Decimal,
        public liveGameCount: number,
        // --- 콤프/포인트 집계 ---
        public totalCompEarned: Prisma.Decimal,
        public totalCompConverted: Prisma.Decimal,
        public totalCompDeducted: Prisma.Decimal,
        // --- 잔액 스냅샷 (현금) ---
        public startBalance: Prisma.Decimal,
        public endBalance: Prisma.Decimal,
        // --- 잔액 스냅샷 (보너스) ---
        public startBonusBalance: Prisma.Decimal,
        public endBonusBalance: Prisma.Decimal,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        date: Date;
        startBalance?: Prisma.Decimal;
        startBonusBalance?: Prisma.Decimal;
    }): UserHourlyStat {
        const now = new Date();
        const zero = new Prisma.Decimal(0);
        return new UserHourlyStat(
            params.userId,
            params.currency,
            params.date,
            // 트랜잭션
            zero,
            zero,
            0,
            0,
            // 보너스
            zero,
            zero,
            zero,
            // 게임 (전체)
            zero,
            zero,
            zero,
            zero,
            0,
            // 슬롯
            zero,
            zero,
            zero,
            0,
            // 라이브
            zero,
            zero,
            zero,
            0,
            // 콤프
            zero,
            zero,
            zero,
            // 잔액 스냅샷 (현금)
            params.startBalance ?? zero,
            params.startBalance ?? zero,
            // 잔액 스냅샷 (보너스)
            params.startBonusBalance ?? zero,
            params.startBonusBalance ?? zero,
            now,
            now,
        );
    }

    // 재구성을 위한 팩토리 메서드 (Repository 용)
    static rehydrate(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        date: Date;
        totalDeposit: Prisma.Decimal;
        totalWithdraw: Prisma.Decimal;
        depositCount: number;
        withdrawCount: number;
        totalBonusGiven: Prisma.Decimal;
        totalBonusUsed: Prisma.Decimal;
        totalBonusConverted: Prisma.Decimal;
        totalBet: Prisma.Decimal;
        totalWin: Prisma.Decimal;
        netWin: Prisma.Decimal;
        ggr: Prisma.Decimal;
        totalGameCount: number;
        slotBetAmount: Prisma.Decimal;
        slotWinAmount: Prisma.Decimal;
        slotGgr: Prisma.Decimal;
        slotGameCount: number;
        liveBetAmount: Prisma.Decimal;
        liveWinAmount: Prisma.Decimal;
        liveGgr: Prisma.Decimal;
        liveGameCount: number;
        totalCompEarned: Prisma.Decimal;
        totalCompConverted: Prisma.Decimal;
        totalCompDeducted: Prisma.Decimal;
        startBalance: Prisma.Decimal;
        endBalance: Prisma.Decimal;
        startBonusBalance: Prisma.Decimal;
        endBonusBalance: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }): UserHourlyStat {
        return new UserHourlyStat(
            params.userId,
            params.currency,
            params.date,
            params.totalDeposit,
            params.totalWithdraw,
            params.depositCount,
            params.withdrawCount,
            params.totalBonusGiven,
            params.totalBonusUsed,
            params.totalBonusConverted,
            params.totalBet,
            params.totalWin,
            params.netWin,
            params.ggr,
            params.totalGameCount,
            params.slotBetAmount,
            params.slotWinAmount,
            params.slotGgr,
            params.slotGameCount,
            params.liveBetAmount,
            params.liveWinAmount,
            params.liveGgr,
            params.liveGameCount,
            params.totalCompEarned,
            params.totalCompConverted,
            params.totalCompDeducted,
            params.startBalance,
            params.endBalance,
            params.startBonusBalance,
            params.endBonusBalance,
            params.createdAt,
            params.updatedAt,
        );
    }
}
