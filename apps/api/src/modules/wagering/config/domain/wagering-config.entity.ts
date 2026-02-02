import { Prisma } from '@prisma/client';

export interface CurrencySetting {
    cancellationThreshold: number; // 오링 취소 기준점
    minBetAmount: number;          // 롤링 기여를 위한 최소 베팅 금액
    maxBetAmount: number;          // 롤링 기여 최대 인정 금액 (Capping)
}

export interface WageringConfigProps {
    id: bigint;
    defaultBonusExpiryDays: number;
    currencySettings: Record<string, CurrencySetting>;
    isWageringCheckEnabled: boolean;
    isAutoCancellationEnabled: boolean;
    updatedAt: Date;
    updatedBy: bigint | null;
}

export class WageringConfig {
    private constructor(private readonly props: WageringConfigProps) { }

    get id(): bigint { return this.props.id; }
    get defaultBonusExpiryDays(): number { return this.props.defaultBonusExpiryDays; }
    get currencySettings(): Record<string, CurrencySetting> { return this.props.currencySettings; }
    get isWageringCheckEnabled(): boolean { return this.props.isWageringCheckEnabled; }
    get isAutoCancellationEnabled(): boolean { return this.props.isAutoCancellationEnabled; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get updatedBy(): bigint | null { return this.props.updatedBy; }

    /**
     * 특정 통화의 오링 임계값을 가져옵니다.
     */
    getCancellationThreshold(currency: string): Prisma.Decimal {
        const setting = this.props.currencySettings?.[currency];
        return new Prisma.Decimal(setting?.cancellationThreshold ?? 0);
    }

    /**
     * 특정 통화의 롤링 기여를 위한 최소 베팅 금액을 가져옵니다.
     */
    getMinBetAmount(currency: string): Prisma.Decimal {
        const setting = this.props.currencySettings?.[currency];
        return new Prisma.Decimal(setting?.minBetAmount ?? 0);
    }

    /**
     * 특정 통화의 롤링 기여 최대 인정 금액(Capping)을 가져옵니다.
     */
    getMaxBetAmount(currency: string): Prisma.Decimal {
        const setting = this.props.currencySettings?.[currency];
        // 0이나 설정이 없으면 무제한(매우 큰 값)으로 처리하거나 0 그대로 반환 후 서비스에서 처리
        return new Prisma.Decimal(setting?.maxBetAmount ?? 0);
    }

    update(params: {
        defaultBonusExpiryDays?: number;
        currencySettings?: Record<string, CurrencySetting>;
        isWageringCheckEnabled?: boolean;
        isAutoCancellationEnabled?: boolean;
        updatedBy: bigint;
    }): void {
        if (params.defaultBonusExpiryDays !== undefined) {
            if (params.defaultBonusExpiryDays < 1) throw new Error('Expiry days must be at least 1');
            this.props.defaultBonusExpiryDays = params.defaultBonusExpiryDays;
        }

        if (params.currencySettings !== undefined) {
            this.props.currencySettings = params.currencySettings;
        }

        if (params.isWageringCheckEnabled !== undefined) this.props.isWageringCheckEnabled = params.isWageringCheckEnabled;
        if (params.isAutoCancellationEnabled !== undefined) this.props.isAutoCancellationEnabled = params.isAutoCancellationEnabled;

        this.props.updatedBy = params.updatedBy;
        this.props.updatedAt = new Date();
    }

    static rehydrate(props: WageringConfigProps): WageringConfig {
        return new WageringConfig(props);
    }
}
