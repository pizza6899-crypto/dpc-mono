import { Injectable, Inject } from '@nestjs/common';
import { ChannelType, Language } from 'src/generated/prisma';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import { NotificationTemplate, NotificationTemplateTranslation } from '../domain';
import { DuplicateTemplateException } from '../domain/template.exception';

interface CreateTemplateParams {
    name: string;
    description?: string;
    event: string;
    channel: ChannelType;
    variables: string[];
    translations?: {
        locale: Language;
        titleTemplate: string;
        bodyTemplate: string;
        actionUriTemplate?: string;
    }[];
}

@Injectable()
export class CreateTemplateService {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
    ) { }

    async execute(params: CreateTemplateParams): Promise<NotificationTemplate> {
        const existing = await this.repository.findByEventAndChannel(params.event, params.channel);
        if (existing) {
            throw new DuplicateTemplateException(params.event, params.channel);
        }

        const template = NotificationTemplate.create({
            name: params.name,
            description: params.description,
            event: params.event,
            channel: params.channel,
            variables: params.variables,
        });

        if (params.translations) {
            for (const t of params.translations) {
                template.addTranslation(
                    NotificationTemplateTranslation.create({
                        locale: t.locale,
                        titleTemplate: t.titleTemplate,
                        bodyTemplate: t.bodyTemplate,
                        actionUriTemplate: t.actionUriTemplate,
                    }),
                );
            }
        }

        return await this.repository.create(template);
    }
}
