import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../ports';
import type { NotificationTemplateRepositoryPort } from '../ports';
import { TemplateNotFoundException } from '../domain/template.exception';

@Injectable()
export class DeleteTemplateService {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<void> {
        const template = await this.repository.findById(id);
        if (!template) {
            throw new TemplateNotFoundException(id);
        }
        await this.repository.delete(id);
    }
}
