import { ChannelType, Language } from '@prisma/client';
import { NOTIFICATION_EVENTS } from 'src/modules/notification/common';
import { TemplateSeed } from '../types';

export const promotionTemplates: TemplateSeed[] = [
    {
        name: '프로모션 적용 알림 (Inbox)',
        event: NOTIFICATION_EVENTS.PROMOTION_APPLIED,
        channel: ChannelType.INBOX,
        variables: ['promotionName', 'bonusAmount', 'currency'],
        translations: {
            create: [
                {
                    locale: Language.KO,
                    titleTemplate: '프로모션 보너스 지급',
                    bodyTemplate: '[{{promotionName}}] 프로모션이 적용되어 {{bonusAmount}} {{currency}} 보너스가 지급되었습니다.',
                },
                {
                    locale: Language.EN,
                    titleTemplate: 'Promotion Bonus Granted',
                    bodyTemplate: '[{{promotionName}}] promotion has been applied, and you received {{bonusAmount}} {{currency}} bonus.',
                },
                {
                    locale: Language.JA,
                    titleTemplate: 'プロモーションボーナス支給',
                    bodyTemplate: '[{{promotionName}}] プロモーションが適用され、{{bonusAmount}} {{currency}} ボーナス가 支給되었습니다.',
                },
            ],
        },
    },
];
