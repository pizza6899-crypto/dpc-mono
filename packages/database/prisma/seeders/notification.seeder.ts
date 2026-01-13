import { PrismaClient, ChannelType, Language } from '../../src';

const templates = [
    {
        name: '회원가입 축하 알림',
        event: 'USER_REGISTERED',
        channel: ChannelType.EMAIL,
        variables: ['email'],
        translations: {
            create: [
                {
                    locale: Language.KO,
                    titleTemplate: '환영합니다, {{email}}님!',
                    bodyTemplate: '회원가입을 진심으로 축하드립니다. 다양한 서비스를 이용해 보세요.',
                },
                {
                    locale: Language.EN,
                    titleTemplate: 'Welcome, {{email}}!',
                    bodyTemplate: 'Thank you for joining us. Enjoy our services.',
                },
                {
                    locale: Language.JA,
                    titleTemplate: 'こんにちは、{{email}}さん!',
                    bodyTemplate: '会員登録を心からお慶び申し上げます。様々なサービスをご活用ください。',
                },
            ],
        },
    },
];

export async function seedNotificationTemplates(prisma: PrismaClient) {
    console.log('  - 알림 템플릿 시딩 중...');

    for (const template of templates) {
        const { translations, ...data } = template;

        // 템플릿 존재 여부 확인 (event, channel 기반)
        const existing = await prisma.notificationTemplate.findUnique({
            where: {
                event_channel: {
                    event: data.event,
                    channel: data.channel as any,
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
                    channel: data.channel as any,
                    variables: data.variables as any,
                    translations,
                },
            });
        }
    }
}
