import { Prisma } from '@prisma/client';

export interface CurrencySetting {
    cancellationThreshold: number; // 오링 취소 기준점
    minBetAmount: number;          // 롤링 기여를 위한 최소 베팅 금액
    maxBetAmount: number;          // 롤링 기여 최대 인정 금액 (Capping)
}

export class WageringConfig {
    public static readonly SINGLETON_ID = 1n;

    constructor(
        public readonly id: bigint,
        public readonly defaultBonusExpiryDays: number,
        public readonly currencySettings: Record<string, CurrencySetting>,
        public readonly isWageringCheckEnabled: boolean,
        public readonly isAutoCancellationEnabled: boolean,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
    ) { }

    /**
     * 특정 통화의 오링 임계값을 가져옵니다.
     */
    getCancellationThreshold(currency: string): Prisma.Decimal {
        const setting = this.currencySettings?.[currency];
        return new Prisma.Decimal(setting?.cancellationThreshold ?? 0);
    }

    /**
     * 특정 통화의 롤링 기여를 위한 최소 베팅 금액을 가져옵니다.
     */
    getMinBetAmount(currency: string): Prisma.Decimal {
        const setting = this.currencySettings?.[currency];
        return new Prisma.Decimal(setting?.minBetAmount ?? 0);
    }

    /**
     * 특정 통화의 롤링 기여 최대 인정 금액(Capping)을 가져옵니다.
     */
    getMaxBetAmount(currency: string): Prisma.Decimal {
        const setting = this.currencySettings?.[currency];
        return new Prisma.Decimal(setting?.maxBetAmount ?? 0);
    }

    /**
     * 프로젝트 스탠다드에 따라 설정 수정은 새로운 인스턴스를 생성하거나 
     * 인프라 레이어에서 처리하도록 유도하며, 도메인 로직(getCancellationThreshold 등)만 유지합니다.
     */
    static fromPersistence(data: {
        id: bigint;
        defaultBonusExpiryDays: number;
        currencySettings: Record<string, CurrencySetting>;
        isWageringCheckEnabled: boolean;
        isAutoCancellationEnabled: boolean;
        updatedAt: Date;
        updatedBy: bigint | null;
    }): WageringConfig {
        return new WageringConfig(
            data.id,
            data.defaultBonusExpiryDays,
            data.currencySettings,
            data.isWageringCheckEnabled,
            data.isAutoCancellationEnabled,
            data.updatedAt,
            data.updatedBy,
        );
    }
}
