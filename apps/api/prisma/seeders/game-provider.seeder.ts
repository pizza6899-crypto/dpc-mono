import { PrismaClient } from '@prisma/client';

// DTO의 WC_PROVIDER_MAP 참고
const WC_PROVIDERS = [
    { externalId: '1', code: 'EVOLUTION_ASIA', name: 'Evolution Asia', groupCode: 'EVOLUTION' },
    { externalId: '29', code: 'EVOLUTION_INDIA', name: 'Evolution India', groupCode: 'EVOLUTION' },
    { externalId: '31', code: 'EVOLUTION_KOREA', name: 'Evolution Korea', groupCode: 'EVOLUTION' },
    { externalId: '28', code: 'PRAGMATIC_PLAY_LIVE', name: 'Pragmatic Play Live', groupCode: 'PRAGMATIC_PLAY' },
    { externalId: '226', code: 'PRAGMATIC_PLAY_SLOTS', name: 'Pragmatic Play Slots', groupCode: 'PRAGMATIC_PLAY' },
];

// DTO의 DCS_PROVIDER_MAP 참고
const DCS_PROVIDERS = [
    { externalId: 'png', code: 'PLAYNGO', name: "Play'n Go", groupCode: 'PLAYNGO' },
    { externalId: 'relax', code: 'RELAX_GAMING', name: 'Relax Gaming', groupCode: 'RELAX_GAMING' },
    // 추후 필요 시 추가: pg_soft(pgs), pragmatic(pp) 등
];

export async function seedGameProviders(prisma: PrismaClient) {
    console.log('🎰 게임 프로바이더 시딩을 시작합니다...');

    // 1. Aggregator 조회
    const wc = await prisma.casinoAggregator.findUnique({ where: { code: 'WC' } });
    const dcs = await prisma.casinoAggregator.findUnique({ where: { code: 'DC' } });

    if (!wc || !dcs) {
        console.error('❌ Aggregator가 존재하지 않습니다. Aggregator 시딩을 먼저 실행해주세요.');
        return;
    }

    // 2. Whitecliff Providers
    for (const p of WC_PROVIDERS) {
        const existing = await prisma.casinoGameProvider.findUnique({
            where: {
                aggregatorId_externalId: {
                    aggregatorId: wc.id,
                    externalId: p.externalId,
                }
            }
        });

        if (!existing) {
            await prisma.casinoGameProvider.create({
                data: {
                    aggregatorId: wc.id,
                    externalId: p.externalId,
                    code: p.code,
                    name: p.name,
                    groupCode: p.groupCode,
                    isActive: true
                }
            });
        }
    }
    console.log(`✅ WC 프로바이더 ${WC_PROVIDERS.length}개 처리 완료`);

    // 3. DCS Providers
    for (const p of DCS_PROVIDERS) {
        const existing = await prisma.casinoGameProvider.findUnique({
            where: {
                aggregatorId_externalId: {
                    aggregatorId: dcs.id,
                    externalId: p.externalId,
                }
            }
        });

        if (!existing) {
            await prisma.casinoGameProvider.create({
                data: {
                    aggregatorId: dcs.id,
                    externalId: p.externalId,
                    code: p.code,
                    name: p.name,
                    groupCode: p.groupCode,
                    isActive: true
                }
            });
        }
    }
    console.log(`✅ DCS 프로바이더 ${DCS_PROVIDERS.length}개 처리 완료`);

    console.log('✅ 게임 프로바이더 시딩이 완료되었습니다.');
}
