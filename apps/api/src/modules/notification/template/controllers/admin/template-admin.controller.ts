// apps/api/src/modules/notification/template/controllers/admin/template-admin.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    NOTIFICATION_TEMPLATE_REPOSITORY,
} from '../../ports';
import type { NotificationTemplateRepositoryPort } from '../../ports';
import { NotificationTemplate, NotificationTemplateTranslation } from '../../domain';
import { CreateTemplateRequestDto } from './dto/request/create-template.request.dto';

@ApiTags('Notification Template Admin')
@Controller('admin/notifications/templates')
export class TemplateAdminController {
    constructor(
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly repository: NotificationTemplateRepositoryPort,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create notification template' })
    async create(@Body() dto: CreateTemplateRequestDto) {
        // Domain logic should be in Service usually, but for simple CRUD mostly ok here or use simple service.
        // Given the complexity of creating Entity + Translations, putting in Controller for brevity for now
        // but better to have CreateTemplateService.

        const template = NotificationTemplate.create({
            name: dto.name,
            description: dto.description,
            event: dto.event,
            channel: dto.channel,
            variables: dto.variables,
        });

        if (dto.translations) {
            for (const t of dto.translations) {
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

        await this.repository.create(template);
        return { success: true, id: template.id?.toString() };
    }

    @Get()
    @ApiOperation({ summary: 'List templates' })
    async list() {
        const templates = await this.repository.list();
        return templates.map(t => ({
            id: t.id?.toString(),
            name: t.name,
            event: t.event,
            channel: t.channel,
            translationsCount: t.translations.length,
            updatedAt: t.updatedAt,
        }));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get template' })
    async get(@Param('id') id: string) {
        const template = await this.repository.findById(BigInt(id));
        if (!template) {
            // NotFoundException
            return null;
        }
        return {
            id: template.id?.toString(),
            name: template.name,
            event: template.event,
            channel: template.channel,
            variables: template.variables,
            translations: template.translations.map(t => ({
                locale: t.locale,
                titleTemplate: t.titleTemplate,
                bodyTemplate: t.bodyTemplate,
            })),
        };
    }
}
