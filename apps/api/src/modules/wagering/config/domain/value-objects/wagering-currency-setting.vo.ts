import { Prisma } from '@prisma/client';

export interface WageringCurrencySettingProps {
    cancellationThreshold: Prisma.Decimal;
    minBetAmount: Prisma.Decimal;
    maxBetAmount: Prisma.Decimal;
}

export class WageringCurrencySetting {
    constructor(private readonly props: WageringCurrencySettingProps) { }

    get cancellationThreshold(): Prisma.Decimal { return this.props.cancellationThreshold; }
    get minBetAmount(): Prisma.Decimal { return this.props.minBetAmount; }
    get maxBetAmount(): Prisma.Decimal { return this.props.maxBetAmount; }

    static empty(): WageringCurrencySetting {
        return new WageringCurrencySetting({
            cancellationThreshold: new Prisma.Decimal(0),
            minBetAmount: new Prisma.Decimal(0),
            maxBetAmount: new Prisma.Decimal(0),
        });
    }

    static fromRaw(data: {
        cancellationThreshold: number | string | Prisma.Decimal;
        minBetAmount: number | string | Prisma.Decimal;
        maxBetAmount: number | string | Prisma.Decimal;
    }): WageringCurrencySetting {
        return new WageringCurrencySetting({
            cancellationThreshold: new Prisma.Decimal(data.cancellationThreshold ?? 0),
            minBetAmount: new Prisma.Decimal(data.minBetAmount ?? 0),
            maxBetAmount: new Prisma.Decimal(data.maxBetAmount ?? 0),
        });
    }

    toRaw() {
        return {
            cancellationThreshold: this.props.cancellationThreshold.toNumber(),
            minBetAmount: this.props.minBetAmount.toNumber(),
            maxBetAmount: this.props.maxBetAmount.toNumber(),
        };
    }
}
