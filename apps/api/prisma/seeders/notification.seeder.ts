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
            // 템플릿 메타데이터만 업데이트 (운영자가 수정한 번역은 건드리지 않음)
            await prisma.notificationTemplate.update({
                where: { id: existing.id },
                data: {
                    name: data.name,
                    variables: data.variables as any,
                },
            });

            // 만약 번역이 하나도 없다면 기본 번역 추가
            if (existing.translations.length === 0) {
                await prisma.notificationTemplate.update({
                    where: { id: existing.id },
                    data: { translations },
                });
            }
        } else {
            // 신규 생성
            await prisma.notificationTemplate.create({
                data: {
                    ...data,
                    channel: data.channel,
                    variables: data.variables as any,
                    translations,
                },
            });
        }
    }
}
