import { PrismaClient, ChatRoomType, Language } from '@prisma/client';

/**
 * 기본 채팅방 시딩 (글로벌 채팅방 등)
 */
export async function seedChatRooms(prisma: PrismaClient) {
    // 1. 한국어 기반 글로벌 채팅방 (기본)
    await prisma.chatRoom.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            type: ChatRoomType.PUBLIC,
            isActive: true,
            metadata: {
                isGlobal: true,
                language: 'ko',
                translations: {
                    [Language.KO]: { name: '글로벌 채팅', description: '다양한 언어의 사용자들이 소통하는 공간입니다.' },
                    [Language.EN]: { name: 'Global Chat', description: 'A place for users of various languages to communicate.' },
                    [Language.JA]: { name: 'グローバルチャット', description: '様々な言語のユーザーが交流する場所です。' },
                },
            },
            slowModeSeconds: 3,
            minTierLevel: 0,
        },
    });
}
