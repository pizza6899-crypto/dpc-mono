// apps/api/src/modules/notification/template/controllers/admin/template-admin.controller.ts

import {
    Controller,
    Get,
    Param,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { FindTemplatesService, FindTemplateByIdService } from '../../application/find-templates.service';
import { NotificationTemplate } from '../../domain';
import {
    TemplateResponseDto,
    TemplateListItemResponseDto,
} from './dto/response/template.response.dto';

@ApiTags('Notification Template Admin')
@Controller('admin/notifications/templates')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class TemplateAdminController {
    constructor(
        private readonly findTemplatesService: FindTemplatesService,
        private readonly findTemplateByIdService: FindTemplateByIdService,
    ) { }

    @Get()
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'NOTIFICATION',
        action: 'NOTIFICATION_TEMPLATE_ADMIN_LIST',
    })
    @ApiOperation({ summary: 'List templates' })
    @ApiStandardResponse(TemplateListItemResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved templates',
        isArray: true,
    })
    async list(): Promise<TemplateListItemResponseDto[]> {
        const templates = await this.findTemplatesService.execute();
        return templates.map(t => this.toListItemResponseDto(t));
    }

    @Get(':id')
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'NOTIFICATION',
        action: 'NOTIFICATION_TEMPLATE_ADMIN_GET',
        extractMetadata: (_, args) => ({
            templateId: args[0],
        }),
    })
    @ApiOperation({ summary: 'Get template' })
    @ApiStandardResponse(TemplateResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully retrieved template',
    })
    async get(@Param('id') id: string): Promise<TemplateResponseDto> {
        const template = await this.findTemplateByIdService.execute(BigInt(id));
        return this.toResponseDto(template);
    }

    private toResponseDto(template: NotificationTemplate): TemplateResponseDto {
        return {
            id: template.id!.toString(),
            name: template.name,
            description: template.description,
            event: template.event,
            channel: template.channel,
            variables: template.variables,
            translations: template.translations.map(t => ({
                locale: t.locale,
                titleTemplate: t.titleTemplate,
                bodyTemplate: t.bodyTemplate,
                actionUriTemplate: t.actionUriTemplate,
            })),
            updatedAt: template.updatedAt.toISOString(),
        };
    }

    private toListItemResponseDto(template: NotificationTemplate): TemplateListItemResponseDto {
        return {
            id: template.id!.toString(),
            name: template.name,
            event: template.event,
            channel: template.channel,
            translationsCount: template.translations.length,
            updatedAt: template.updatedAt.toISOString(),
        };
    }
}
