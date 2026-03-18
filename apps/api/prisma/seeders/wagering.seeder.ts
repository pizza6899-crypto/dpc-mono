import { ExchangeCurrencyCode, PrismaClient } from '@prisma/client';
import { WageringCurrencySettingProps } from '../../src/modules/wagering/config/domain/value-objects/wagering-currency-setting.vo';

export async function seedWageringConfig(prisma: PrismaClient) {
    console.log('   - Seeding Wagering Config...');
    const configId = 1n;

    const existingConfig = await prisma.wageringConfig.findUnique({
        where: { id: configId },
    });

    if (!existingConfig) {
        // [!] 도메인 VO Props와 완벽하게 동기화된 타입 정의
        const currencySettings: Record<string, WageringCurrencySettingProps> = {

            [ExchangeCurrencyCode.USDT]: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 },
            [ExchangeCurrencyCode.USD]: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 },
            [ExchangeCurrencyCode.KRW]: { cancellationThreshold: 500, minBetAmount: 100, maxBetAmount: 0 },
            [ExchangeCurrencyCode.JPY]: { cancellationThreshold: 50, minBetAmount: 10, maxBetAmount: 0 },
            [ExchangeCurrencyCode.PHP]: { cancellationThreshold: 20, minBetAmount: 5, maxBetAmount: 0 },
            [ExchangeCurrencyCode.IDR]: { cancellationThreshold: 5000, minBetAmount: 1000, maxBetAmount: 0 },
            [ExchangeCurrencyCode.VND]: { cancellationThreshold: 10000, minBetAmount: 2000, maxBetAmount: 0 },
            [ExchangeCurrencyCode.BTC]: { cancellationThreshold: 0.00001, minBetAmount: 0.000001, maxBetAmount: 0 },
            [ExchangeCurrencyCode.ETH]: { cancellationThreshold: 0.0001, minBetAmount: 0.00001, maxBetAmount: 0 },
            [ExchangeCurrencyCode.SOL]: { cancellationThreshold: 0.01, minBetAmount: 0.001, maxBetAmount: 0 },
            [ExchangeCurrencyCode.XRP]: { cancellationThreshold: 1, minBetAmount: 0.1, maxBetAmount: 0 },
            [ExchangeCurrencyCode.DOGE]: { cancellationThreshold: 10, minBetAmount: 1, maxBetAmount: 0 },
            [ExchangeCurrencyCode.LTC]: { cancellationThreshold: 0.01, minBetAmount: 0.001, maxBetAmount: 0 },
            [ExchangeCurrencyCode.BCH]: { cancellationThreshold: 0.01, minBetAmount: 0.001, maxBetAmount: 0 },
            [ExchangeCurrencyCode.EOS]: { cancellationThreshold: 1, minBetAmount: 0.1, maxBetAmount: 0 },
            [ExchangeCurrencyCode.TRX]: { cancellationThreshold: 10, minBetAmount: 1, maxBetAmount: 0 },
        };

        await prisma.wageringConfig.create({
            data: {
                id: configId,
                currencySettings: currencySettings as any,

                isWageringCheckEnabled: true,
                isAutoCancellationEnabled: true,
            },
        });
        console.log('   ✅ Wagering config seeded.');
    } else {
        console.log('   ℹ️ Wagering config already exists. Skipping.');
    }
}
