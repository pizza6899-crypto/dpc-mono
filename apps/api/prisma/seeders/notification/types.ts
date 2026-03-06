import { ChannelType, Language } from '@prisma/client';
import { type NotificationEventType } from 'src/modules/notification/common';

export interface TemplateSeed {
    name: string;
    event: NotificationEventType;
    channel: ChannelType;
    variables: string[];
    translations: {
        create: {
            locale: Language;
            titleTemplate: string;
            bodyTemplate: string;
            actionUriTemplate?: string;
        }[];
    };
}
