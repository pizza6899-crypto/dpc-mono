import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import { NotificationTemplate } from '../domain';

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
            throw new NotFoundException(`Template not found: ${id}`);
        }
        return template;
    }
}
