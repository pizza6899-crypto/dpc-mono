// apps/api/src/modules/notification/template/controllers/admin/template-admin.controller.ts

import {
    Controller,
    Get,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { FindTemplatesService } from '../../application/find-templates.service';
import { NotificationTemplate } from '../../domain';
import {
    TemplateListItemResponseDto,
} from './dto/response/template.response.dto';

@ApiTags('Admin Notification Template')
@Controller('admin/notifications/templates')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class TemplateAdminController {
    constructor(
        private readonly findTemplatesService: FindTemplatesService,
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

    private toListItemResponseDto(template: NotificationTemplate): TemplateListItemResponseDto {
        return {
            id: template.id!.toString(),
            name: template.name,
            description: template.description,
            event: template.event,
            channel: template.channel,
            variables: template.variables,
            translationsCount: template.translations.length,
            translations: template.translations.map(t => ({
                locale: t.locale,
                titleTemplate: t.titleTemplate,
                bodyTemplate: t.bodyTemplate,
                actionUriTemplate: t.actionUriTemplate,
            })),
            updatedAt: template.updatedAt.toISOString(),
        };
    }
}
