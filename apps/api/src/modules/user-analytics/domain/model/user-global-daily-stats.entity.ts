import { Prisma } from '@prisma/client';

/**
 * UserGlobalDailyStats 도메인 엔티티
 * 
 * 특정 날짜(Date) 구간 내의 유저 활동 변동량을 관리합니다.
 * 타임스탬프는 UTC 기준 자정(00:00:00)으로 고정됩니다.
 */
export class UserGlobalDailyStats {
    private constructor(
        public readonly userId: bigint,
        public readonly date: Date,

        // KPI Variation
        private _ltvUsd: Prisma.Decimal,
        private _ggrUsd: Prisma.Decimal,
        private _ngrUsd: Prisma.Decimal,

        // Daily Accumulations
        private _dailyDepositUsd: Prisma.Decimal,
        private _dailyWithdrawUsd: Prisma.Decimal,
        private _dailyBetUsd: Prisma.Decimal,
        private _dailyWinUsd: Prisma.Decimal,
        private _dailyPromoUsd: Prisma.Decimal,

        public readonly updatedAt: Date,
    ) { }

    /**
     * 특정 날짜의 초기 통계 생성
     */
    static create(userId: bigint, date: Date): UserGlobalDailyStats {
        const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        return new UserGlobalDailyStats(
            userId,
            utcDate,
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Date(),
        );
    }

    /**
     * DB 영속성 레이어로부터 엔티티 복원
     */
    static fromPersistence(data: {
        userId: bigint;
        date: Date;
        ltvUsd: Prisma.Decimal;
        ggrUsd: Prisma.Decimal;
        ngrUsd: Prisma.Decimal;
        dailyDepositUsd: Prisma.Decimal;
        dailyWithdrawUsd: Prisma.Decimal;
        dailyBetUsd: Prisma.Decimal;
        dailyWinUsd: Prisma.Decimal;
        dailyPromoUsd: Prisma.Decimal;
        updatedAt: Date;
    }): UserGlobalDailyStats {
        return new UserGlobalDailyStats(
            data.userId,
            data.date,
            data.ltvUsd,
            data.ggrUsd,
            data.ngrUsd,
            data.dailyDepositUsd,
            data.dailyWithdrawUsd,
            data.dailyBetUsd,
            data.dailyWinUsd,
            data.dailyPromoUsd,
            data.updatedAt,
        );
    }

    // Getters
    get ltvUsd(): Prisma.Decimal { return this._ltvUsd; }
    get ggrUsd(): Prisma.Decimal { return this._ggrUsd; }
    get ngrUsd(): Prisma.Decimal { return this._ngrUsd; }
    get dailyDepositUsd(): Prisma.Decimal { return this._dailyDepositUsd; }
    get dailyWithdrawUsd(): Prisma.Decimal { return this._dailyWithdrawUsd; }
    get dailyBetUsd(): Prisma.Decimal { return this._dailyBetUsd; }
    get dailyWinUsd(): Prisma.Decimal { return this._dailyWinUsd; }
    get dailyPromoUsd(): Prisma.Decimal { return this._dailyPromoUsd; }
}
