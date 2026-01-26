import { PrismaClient } from '@prisma/client';

export async function seedCompConfig(prisma: PrismaClient) {
    const existing = await prisma.compConfig.findFirst();

    if (existing) {
        console.log('⏩ CompConfig already exists, skipping seeding.');
        return;
    }

    await prisma.compConfig.create({
        data: {
            // 적립 가능 여부 (시스템 스위치)
            isEarnEnabled: true,
            // 전환 가능 여부 (시스템 스위치)
            isClaimEnabled: true,
            // 마이너스 잔액 허용 (롤백 시 대응용)
            allowNegativeBalance: true,
            // 최소 전환 가능 금액
            minClaimAmount: 0.01,
            // 유저당 일일 최대 적립 제한 (0 = 무제한)
            maxDailyEarnPerUser: 0,
            // 콤프 유효 기간 (일 단위, 기본 1년)
            expirationDays: 365,
            // 설정 설명
            description: '시스템 기본 콤프 설정',
        },
    });

    console.log('✅ CompConfig seeded successfully.');
}
