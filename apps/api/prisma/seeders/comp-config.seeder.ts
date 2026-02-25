import { PrismaClient, ExchangeCurrencyCode } from '@prisma/client';

export async function seedCompConfig(prisma: PrismaClient) {
    const currencies = [ExchangeCurrencyCode.KRW];

    for (const currency of currencies) {
        // We use findFirst temporarily if findUnique is not available due to type issues locally
        // but it should be findUnique({ where: { currency } }) after regeneration
        // Let's use upsert or check existence robustly
        const existing = await prisma.compConfig.findFirst({
            where: { currency },
        });

        if (existing) {
            console.log(`⏩ CompConfig for ${currency} already exists, skipping.`);
            continue;
        }

        await prisma.compConfig.create({
            data: {
                currency,
                isEarnEnabled: true,
                isSettlementEnabled: true,
                minSettlementAmount: 0, // 최소 정산 금액 제한 없음
                maxDailyEarnPerUser: 0, // 일일 적립 한도 무제한
                description: `Unlimited Comp Policy for ${currency}`,
            },
        });

        console.log(`✅ CompConfig for ${currency} seeded.`);
    }
}
