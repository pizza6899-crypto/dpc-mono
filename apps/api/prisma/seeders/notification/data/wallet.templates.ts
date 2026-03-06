import { ChannelType, Language } from '@prisma/client';
import { NOTIFICATION_EVENTS } from 'src/modules/notification/common';
import { TemplateSeed } from '../types';

export const walletTemplates: TemplateSeed[] = [
    {
        name: '입금 신청 알림 (Admin Inbox)',
        event: NOTIFICATION_EVENTS.FIAT_DEPOSIT_REQUESTED,
        channel: ChannelType.INBOX,
        variables: ['amount', 'currency', 'depositorName'],
        translations: {
            create: [
                {
                    locale: Language.KO,
                    titleTemplate: '새로운 입금 신청 발생',
                    bodyTemplate: '{{depositorName}}님으로부터 {{amount}} {{currency}} 입금 신청이 접수되었습니다.',
                    actionUriTemplate: '/admin/assets/deposits',
                },
                {
                    locale: Language.EN,
                    titleTemplate: 'New Deposit Request',
                    bodyTemplate: 'A deposit request of {{amount}} {{currency}} has been received from {{depositorName}}.',
                    actionUriTemplate: '/admin/assets/deposits',
                },
                {
                    locale: Language.JA,
                    titleTemplate: '新しい入金申請',
                    bodyTemplate: '{{depositorName}}様から {{amount}} {{currency}} の入金申請が届きました。',
                    actionUriTemplate: '/admin/assets/deposits',
                },
            ],
        },
    },
];
