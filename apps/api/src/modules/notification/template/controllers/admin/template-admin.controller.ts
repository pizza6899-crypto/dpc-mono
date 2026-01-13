// apps/api/src/modules/notification/template/controllers/admin/template-admin.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    ApiStandardResponse,
    ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { CreateTemplateService } from '../../application/create-template.service';
import { UpdateTemplateService } from '../../application/update-template.service';
import { FindTemplatesService, FindTemplateByIdService } from '../../application/find-templates.service';
import { DeleteTemplateService } from '../../application/delete-template.service';
import { NotificationTemplate } from '../../domain';
import { CreateTemplateRequestDto } from './dto/request/create-template.request.dto';
import { UpdateTemplateRequestDto } from './dto/request/update-template.request.dto';
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
        private readonly createTemplateService: CreateTemplateService,
        private readonly updateTemplateService: UpdateTemplateService,
        private readonly findTemplatesService: FindTemplatesService,
        private readonly findTemplateByIdService: FindTemplateByIdService,
        private readonly deleteTemplateService: DeleteTemplateService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'NOTIFICATION',
        action: 'NOTIFICATION_TEMPLATE_ADMIN_CREATE',
        extractMetadata: (_, args, result) => ({
            request: args[0],
            templateId: result?.id,
        }),
    })
    @ApiOperation({ summary: 'Create notification template' })
    @ApiStandardResponse(TemplateResponseDto, {
        status: HttpStatus.CREATED,
        description: 'Successfully created template',
    })
    async create(@Body() dto: CreateTemplateRequestDto): Promise<TemplateResponseDto> {
        const template = await this.createTemplateService.execute(dto);
        return this.toResponseDto(template);
    }

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
        const template = await this.findTemplateByIdService.execute(
            this.sqidsService.decode(id, SqidsPrefix.NOTIFICATION_TEMPLATE)
        );
        return this.toResponseDto(template);
    }

    @Patch(':id')
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'NOTIFICATION',
        action: 'NOTIFICATION_TEMPLATE_ADMIN_UPDATE',
        extractMetadata: (_, args) => ({
            templateId: args[0],
            request: args[1],
        }),
    })
    @ApiOperation({ summary: 'Update template' })
    @ApiStandardResponse(TemplateResponseDto, {
        status: HttpStatus.OK,
        description: 'Successfully updated template',
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTemplateRequestDto,
    ): Promise<TemplateResponseDto> {
        const template = await this.updateTemplateService.execute({
            id: this.sqidsService.decode(id, SqidsPrefix.NOTIFICATION_TEMPLATE),
            ...dto,
        });
        return this.toResponseDto(template);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'NOTIFICATION',
        action: 'NOTIFICATION_TEMPLATE_ADMIN_DELETE',
        extractMetadata: (_, args) => ({
            templateId: args[0],
        }),
    })
    @ApiOperation({ summary: 'Delete template' })
    @ApiStandardResponse(undefined, {
        status: HttpStatus.NO_CONTENT,
        description: 'Successfully deleted template',
    })
    async delete(@Param('id') id: string): Promise<void> {
        await this.deleteTemplateService.execute(
            this.sqidsService.decode(id, SqidsPrefix.NOTIFICATION_TEMPLATE)
        );
    }

    private toResponseDto(template: NotificationTemplate): TemplateResponseDto {
        return {
            id: this.sqidsService.encode(template.id!, SqidsPrefix.NOTIFICATION_TEMPLATE),
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
            id: this.sqidsService.encode(template.id!, SqidsPrefix.NOTIFICATION_TEMPLATE),
            name: template.name,
            event: template.event,
            channel: template.channel,
            translationsCount: template.translations.length,
            updatedAt: template.updatedAt.toISOString(),
        };
    }
}
