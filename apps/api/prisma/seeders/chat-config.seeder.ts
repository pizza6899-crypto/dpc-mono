import { PrismaClient } from '@prisma/client';

export async function seedChatConfig(prisma: PrismaClient) {
    const configData = {
        isGlobalChatEnabled: true,
        maxMessageLength: 500,
        defaultSlowModeSeconds: 3,
        minChatTierLevel: 0,
        blockDuplicateMessages: true,
    };

    await prisma.chatConfig.upsert({
        where: { id: 1 },
        update: {}, // 기존 데이터가 존재하면 변경하지 않음
        create: {
            id: 1,
            ...configData,
        },
    });

    console.log('✅ 전역 채팅 설정(ChatConfig) 시딩이 완료되었습니다.');
}
