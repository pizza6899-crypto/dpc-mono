import { PrismaClient } from '@prisma/client';
import { notificationTemplates } from './notification/data';

export async function seedNotificationTemplates(prisma: PrismaClient) {
    console.log('  - 알림 템플릿 시딩 중...');

    for (const template of notificationTemplates) {
        const { translations, ...data } = template;

        // 템플릿 존재 여부 확인 (event, channel 기반)
        const existing = await prisma.notificationTemplate.findUnique({
            where: {
                event_channel: {
                    event: data.event,
                    channel: data.channel,
                },
            },
            include: { translations: true },
        });

        if (existing) {
            // 이미 존재할 경우 스킵 (운영자가 수정한 데이터 보호)
            console.log(`    ⏩ Notification template [${data.event}] for channel [${data.channel}] already exists. Skipping.`);
            continue;
        }

        // 신규 생성
        await prisma.notificationTemplate.create({
            data: {
                ...data,
                channel: data.channel,
                variables: data.variables as any,
                translations,
            },
        });
        console.log(`    ✅ Notification template [${data.event}] for channel [${data.channel}] created.`);
    }
}
