import { PrismaClient } from '@prisma/client';

export async function seedWageringConfig(prisma: PrismaClient) {
    console.log('   - Seeding Wagering Config...');
    const configId = 1n;

    const existingConfig = await prisma.wageringConfig.findUnique({
        where: { id: configId },
    });

    if (!existingConfig) {
        await prisma.wageringConfig.create({
            data: {
                id: configId,
                currencySettings: {
                    USDT: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 },
                    USD: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 },
                    KRW: { cancellationThreshold: 500, minBetAmount: 100, maxBetAmount: 0 },
                    JPY: { cancellationThreshold: 50, minBetAmount: 10, maxBetAmount: 0 },
                    PHP: { cancellationThreshold: 20, minBetAmount: 5, maxBetAmount: 0 },
                    IDR: { cancellationThreshold: 5000, minBetAmount: 1000, maxBetAmount: 0 },
                    VND: { cancellationThreshold: 10000, minBetAmount: 2000, maxBetAmount: 0 },
                    BTC: { cancellationThreshold: 0.00001, minBetAmount: 0.000001, maxBetAmount: 0 },
                    ETH: { cancellationThreshold: 0.0001, minBetAmount: 0.00001, maxBetAmount: 0 },
                    SOL: { cancellationThreshold: 0.01, minBetAmount: 0.001, maxBetAmount: 0 },
                    XRP: { cancellationThreshold: 1, minBetAmount: 0.1, maxBetAmount: 0 },
                    DOGE: { cancellationThreshold: 10, minBetAmount: 1, maxBetAmount: 0 },
                    LTC: { cancellationThreshold: 0.01, minBetAmount: 0.001, maxBetAmount: 0 },
                    BCH: { cancellationThreshold: 0.01, minBetAmount: 0.001, maxBetAmount: 0 },
                    EOS: { cancellationThreshold: 1, minBetAmount: 0.1, maxBetAmount: 0 },
                    TRX: { cancellationThreshold: 10, minBetAmount: 1, maxBetAmount: 0 },
                },
                isWageringCheckEnabled: true,
                isAutoCancellationEnabled: true,
            },
        });
        console.log('   ✅ Wagering config seeded.');
    } else {
        console.log('   ℹ️ Wagering config already exists. Skipping.');
    }
}
