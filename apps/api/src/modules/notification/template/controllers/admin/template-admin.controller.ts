// apps/api/src/modules/notification/template/controllers/admin/template-admin.controller.ts

import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { FindTemplatesService } from '../../application/find-templates.service';
import { UpdateTemplateTranslationService } from '../../application/update-template-translation.service';
import { NotificationTemplate } from '../../domain';
import {
  TemplateListItemResponseDto,
  TemplateResponseDto,
} from './dto/response/template.response.dto';
import { TemplateTranslationParamDto } from './dto/request/template-translation.param.dto';
import { UpdateTemplateTranslationRequestDto } from './dto/request/update-template-translation.request.dto';

@ApiTags('Admin Notification Template')
@Controller('admin/notifications/templates')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class TemplateAdminController {
  constructor(
    private readonly findTemplatesService: FindTemplatesService,
    private readonly updateTranslationService: UpdateTemplateTranslationService,
  ) { }

  @Get()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_TEMPLATE_ADMIN_LIST',
  })
  @ApiOperation({ summary: 'List notification templates / 알림 템플릿 목록 조회' })
  @ApiStandardResponse(TemplateListItemResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved templates / 템플릿 목록 조회 성공',
    isArray: true,
  })
  async list(): Promise<TemplateListItemResponseDto[]> {
    const templates = await this.findTemplatesService.execute();
    return templates.map((t) => this.toListItemResponseDto(t));
  }

  @Put(':id/translations/:locale')
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'NOTIFICATION',
    action: 'NOTIFICATION_TEMPLATE_TRANSLATION_UPDATE',
    extractMetadata: (_, args) => ({
      templateId: args[0].id,
      locale: args[0].locale,
      request: args[1],
    }),
  })
  @ApiOperation({ summary: 'Update or Create translation for template / 템플릿 번역 수정 또는 생성' })
  @ApiStandardResponse(TemplateResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully updated translation / 번역 수정 성공',
  })
  async updateTranslation(
    @Param() params: TemplateTranslationParamDto,
    @Body() dto: UpdateTemplateTranslationRequestDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.updateTranslationService.execute({
      templateId: BigInt(params.id),
      locale: params.locale,
      ...dto,
    });

    return this.toResponseDto(template);
  }

  private toListItemResponseDto(
    template: NotificationTemplate,
  ): TemplateListItemResponseDto {
    return {
      ...this.toResponseDto(template),
      translationsCount: template.translations.length,
    };
  }

  private toResponseDto(template: NotificationTemplate): TemplateResponseDto {
    return {
      id: template.id!.toString(),
      name: template.name,
      description: template.description,
      event: template.event,
      channel: template.channel,
      variables: template.variables,
      translations: template.translations.map((t) => ({
        locale: t.locale,
        titleTemplate: t.titleTemplate,
        bodyTemplate: t.bodyTemplate,
        actionUriTemplate: t.actionUriTemplate,
      })),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}
