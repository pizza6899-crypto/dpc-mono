import { PrismaClient, Language, CategoryType } from '@repo/database';

export async function seedGameCategories(prisma: PrismaClient) {
    console.log('🎮 게임 카테고리 시딩을 시작합니다...');

    const CATEGORIES = [
        // ═══════════════════════════════════════════════════════════════
        // PRIMARY 카테고리 (게임 본질적 타입)
        // ═══════════════════════════════════════════════════════════════
        {
            code: 'SLOTS',
            type: CategoryType.PRIMARY,
            sortOrder: 10,
            isSystem: true, // 시스템 카테고리 (삭제 방지)
            translations: {
                [Language.KO]: { name: '슬롯', description: '다양한 테마의 슬롯 게임' },
                [Language.EN]: { name: 'Slots', description: 'Various themed slot games' },
                [Language.JA]: { name: 'スロット', description: '様々なテーマのスロットゲーム' },
            },
        },
        {
            code: 'LIVE_CASINO',
            type: CategoryType.PRIMARY,
            sortOrder: 20,
            isSystem: true,
            translations: {
                [Language.KO]: { name: '라이브 카지노', description: '실시간 딜러와 함께하는 게임' },
                [Language.EN]: { name: 'Live Casino', description: 'Real-time games with live dealers' },
                [Language.JA]: { name: 'ライブカジノ', description: 'リアルタイムディーラーとのゲーム' },
            },
        },

        // ═══════════════════════════════════════════════════════════════
        // COLLECTION 카테고리 (운영/마케팅 목적)
        // ═══════════════════════════════════════════════════════════════
        {
            code: 'POPULAR',
            type: CategoryType.COLLECTION,
            sortOrder: 30,
            isSystem: false,
            translations: {
                [Language.KO]: { name: '인기 게임', description: '가장 많이 플레이되는 게임' },
                [Language.EN]: { name: 'Popular', description: 'Most played games' },
                [Language.JA]: { name: '人気ゲーム', description: '最も多くプレイされているゲーム' },
            },
        },
        {
            code: 'RECOMMENDED',
            type: CategoryType.COLLECTION,
            sortOrder: 40,
            isSystem: false,
            translations: {
                [Language.KO]: { name: '추천 게임', description: '운영진이 추천하는 게임' },
                [Language.EN]: { name: 'Recommended', description: 'Staff recommended games' },
                [Language.JA]: { name: 'おすすめゲーム', description: 'スタッフおすすめゲーム' },
            },
        },
        {
            code: 'WEEKLY_HOT',
            type: CategoryType.COLLECTION,
            sortOrder: 50,
            isSystem: false,
            translations: {
                [Language.KO]: { name: '주간 인기', description: '이번 주 가장 핫한 게임' },
                [Language.EN]: { name: 'Weekly Hot', description: 'This week\'s hottest games' },
                [Language.JA]: { name: '週間人気', description: '今週最も人気のゲーム' },
            },
        },
        {
            code: 'HIGH_RTP',
            type: CategoryType.COLLECTION,
            sortOrder: 60,
            isSystem: false,
            translations: {
                [Language.KO]: { name: '높은 환수율', description: 'RTP가 높은 게임' },
                [Language.EN]: { name: 'High RTP', description: 'Games with high return to player' },
                [Language.JA]: { name: '高還元率', description: 'RTPが高いゲーム' },
            },
        },
    ];

    for (const categoryData of CATEGORIES) {
        // 1. Category Upsert
        const category = await prisma.casinoGameCategory.upsert({
            where: { code: categoryData.code },
            update: {
                type: categoryData.type,
                sortOrder: categoryData.sortOrder,
                isSystem: categoryData.isSystem,
            },
            create: {
                code: categoryData.code,
                type: categoryData.type,
                sortOrder: categoryData.sortOrder,
                isActive: true,
                isSystem: categoryData.isSystem,
            },
        });

        // 2. Translations Upsert
        for (const [lang, translation] of Object.entries(categoryData.translations)) {
            await prisma.casinoGameCategoryTranslation.upsert({
                where: {
                    categoryId_language: {
                        categoryId: category.id,
                        language: lang as Language,
                    },
                },
                update: {
                    name: translation.name,
                    description: translation.description,
                },
                create: {
                    categoryId: category.id,
                    language: lang as Language,
                    name: translation.name,
                    description: translation.description,
                },
            });
        }

        console.log(`  ✓ ${categoryData.code} (${categoryData.type}) 카테고리 생성 완료`);
    }

    console.log('✅ 게임 카테고리 시딩이 완료되었습니다.');
}
