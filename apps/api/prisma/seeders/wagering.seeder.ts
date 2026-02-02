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
                defaultBonusExpiryDays: 30,
                currencySettings: {
                    KRW: { cancellationThreshold: 500, minBetAmount: 100, maxBetAmount: 0 },
                    // USD: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 },
                    // BTC: { cancellationThreshold: 0.00001, minBetAmount: 0.000001, maxBetAmount: 0 },
                    // ETH: { cancellationThreshold: 0.0001, minBetAmount: 0.0001, maxBetAmount: 0 },
                    // USDT: { cancellationThreshold: 0.5, minBetAmount: 0.1, maxBetAmount: 0 },
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
