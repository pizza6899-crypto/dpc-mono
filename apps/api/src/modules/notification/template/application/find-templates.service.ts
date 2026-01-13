import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import { NotificationTemplate } from '../domain';
import { TemplateNotFoundException } from '../domain/template.exception';

@Injectable()
export class FindTemplatesService {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
    ) { }

    async execute(): Promise<NotificationTemplate[]> {
        return await this.repository.list();
    }
}

@Injectable()
export class FindTemplateByIdService {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<NotificationTemplate> {
        const template = await this.repository.findById(id);
        if (!template) {
            throw new TemplateNotFoundException(id);
        }
        return template;
    }
}
