import { PrismaClient, AggregatorStatus } from '../../src';

export async function seedAggregators(prisma: PrismaClient) {
    console.log('🎰 카지노 애그리게이터 시딩을 시작합니다...');

    const AGGREGATORS = [
        {
            code: 'DC',
            name: 'DC ACE',
        },
        {
            code: 'WC',
            name: 'Whitecliff',
        },
    ];

    for (const aggregatorData of AGGREGATORS) {
        const aggregator = await prisma.casinoAggregator.upsert({
            where: { code: aggregatorData.code },
            update: {},
            create: {
                name: aggregatorData.name,
                code: aggregatorData.code,
                status: AggregatorStatus.ACTIVE,
            },
        });
        console.log(`✅ 애그리게이터 생성 완료: ${aggregator.name} (ID: ${aggregator.id})`);
    }

    console.log('✅ 카지노 애그리게이터 시딩이 완료되었습니다.');
}
