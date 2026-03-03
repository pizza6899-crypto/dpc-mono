import { Prisma } from '@prisma/client';

/**
 * UserGlobalHourlyStats 도메인 엔티티
 * 
 * 특정 시간(Hour) 구간 내의 유저 활동 변동량을 관리합니다.
 * 타임스탬프는 UTC 기준 정각(XX:00:00)으로 고정됩니다.
 */
export class UserGlobalHourlyStats {
    private constructor(
        public readonly userId: bigint,
        public readonly hour: Date,

        // KPI Variation
        private _ltvUsd: Prisma.Decimal,
        private _ggrUsd: Prisma.Decimal,
        private _ngrUsd: Prisma.Decimal,

        // Hourly Accumulations
        private _hourlyDepositUsd: Prisma.Decimal,
        private _hourlyWithdrawUsd: Prisma.Decimal,
        private _hourlyBetUsd: Prisma.Decimal,
        private _hourlyWinUsd: Prisma.Decimal,
        private _hourlyPromoUsd: Prisma.Decimal,

        public readonly updatedAt: Date,
    ) { }

    /**
     * 특정 시간의 초기 통계 생성
     */
    static create(userId: bigint, date: Date): UserGlobalHourlyStats {
        const utcHourStr = date.toISOString().substring(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH:00:00.000Z
        const utcHour = new Date(utcHourStr);

        return new UserGlobalHourlyStats(
            userId,
            utcHour,
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
        hour: Date;
        ltvUsd: Prisma.Decimal;
        ggrUsd: Prisma.Decimal;
        ngrUsd: Prisma.Decimal;
        hourlyDepositUsd: Prisma.Decimal;
        hourlyWithdrawUsd: Prisma.Decimal;
        hourlyBetUsd: Prisma.Decimal;
        hourlyWinUsd: Prisma.Decimal;
        hourlyPromoUsd: Prisma.Decimal;
        updatedAt: Date;
    }): UserGlobalHourlyStats {
        return new UserGlobalHourlyStats(
            data.userId,
            data.hour,
            data.ltvUsd,
            data.ggrUsd,
            data.ngrUsd,
            data.hourlyDepositUsd,
            data.hourlyWithdrawUsd,
            data.hourlyBetUsd,
            data.hourlyWinUsd,
            data.hourlyPromoUsd,
            data.updatedAt,
        );
    }

    // Getters
    get ltvUsd(): Prisma.Decimal { return this._ltvUsd; }
    get ggrUsd(): Prisma.Decimal { return this._ggrUsd; }
    get ngrUsd(): Prisma.Decimal { return this._ngrUsd; }
    get hourlyDepositUsd(): Prisma.Decimal { return this._hourlyDepositUsd; }
    get hourlyWithdrawUsd(): Prisma.Decimal { return this._hourlyWithdrawUsd; }
    get hourlyBetUsd(): Prisma.Decimal { return this._hourlyBetUsd; }
    get hourlyWinUsd(): Prisma.Decimal { return this._hourlyWinUsd; }
    get hourlyPromoUsd(): Prisma.Decimal { return this._hourlyPromoUsd; }
}
