import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@repo/database';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import { NotificationTemplate, NotificationTemplateTranslation } from '../domain';

interface UpdateTemplateParams {
    id: bigint;
    name?: string;
    description?: string;
    event?: string;
    channel?: ChannelType;
    variables?: string[];
    translations?: {
        locale: string;
        titleTemplate: string;
        bodyTemplate: string;
        actionUriTemplate?: string;
    }[];
}

@Injectable()
export class UpdateTemplateService {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
    ) { }

    async execute({ id, ...params }: UpdateTemplateParams): Promise<NotificationTemplate> {
        const template = await this.repository.findById(id);
        if (!template) {
            throw new NotFoundException(`Template not found: ${id}`);
        }

        // Apply changes
        template.update(params);

        if (params.translations) {
            template.clearTranslations();
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

        return await this.repository.update(template);
    }
}
