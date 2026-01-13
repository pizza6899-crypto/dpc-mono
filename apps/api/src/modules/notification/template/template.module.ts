// apps/api/src/modules/notification/template/template.module.ts

import { Module } from '@nestjs/common';
import { NotificationTemplateMapper } from './infrastructure/mappers/notification-template.mapper';
import { NotificationTemplateRepository } from './infrastructure/repositories/notification-template.repository';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from './ports';
import { HandlebarsRenderer } from './infrastructure/renderers/handlebars.renderer';
import { EmailHandlebarsRenderer } from './infrastructure/renderers/email-handlebars.renderer';
import { RendererFactory } from './infrastructure/renderers/renderer.factory';
import { RenderTemplateService } from './application/render-template.service';
import { CreateTemplateService } from './application/create-template.service';
import { UpdateTemplateService } from './application/update-template.service';
import { FindTemplatesService, FindTemplateByIdService } from './application/find-templates.service';
import { DeleteTemplateService } from './application/delete-template.service';
import { TemplateAdminController } from './controllers/admin/template-admin.controller';

@Module({
    controllers: [TemplateAdminController],
    providers: [
        // Mapper
        NotificationTemplateMapper,

        // Repository
        {
            provide: NOTIFICATION_TEMPLATE_REPOSITORY,
            useClass: NotificationTemplateRepository,
        },

        // Renderers
        HandlebarsRenderer,
        EmailHandlebarsRenderer,
        RendererFactory,

        // Application Service
        RenderTemplateService,
        CreateTemplateService,
        UpdateTemplateService,
        FindTemplatesService,
        FindTemplateByIdService,
        DeleteTemplateService,
    ],
    exports: [
        RenderTemplateService,
        NOTIFICATION_TEMPLATE_REPOSITORY,
    ],
})
export class TemplateModule { }
