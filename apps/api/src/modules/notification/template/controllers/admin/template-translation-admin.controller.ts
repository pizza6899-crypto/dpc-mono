// apps/api/src/modules/notification/template/controllers/admin/template-translation-admin.controller.ts

import { Controller, Put, Body, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType, Language } from '@prisma/client';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { UpdateTemplateTranslationService } from '../../application/update-template-translation.service';
import { TemplateResponseDto } from './dto/response/template.response.dto';
import { TemplateTranslationParamDto } from './dto/request/template-translation.param.dto';
import { UpdateTemplateTranslationRequestDto } from './dto/request/update-template-translation.request.dto';

@ApiTags('Admin Notification Template')
@Controller('admin/notifications/templates')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class TemplateTranslationAdminController {
  constructor(
    private readonly updateTranslationService: UpdateTemplateTranslationService,
  ) {}

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
  @ApiOperation({ summary: 'Update or Create translation for template' })
  @ApiStandardResponse(TemplateResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully updated translation',
  })
  async update(
    @Param() params: TemplateTranslationParamDto,
    @Body() dto: UpdateTemplateTranslationRequestDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.updateTranslationService.execute({
      templateId: BigInt(params.id),
      locale: params.locale,
      ...dto,
    });

    // Response DTO logic (duplicated from TemplateAdminController - consider moving to a shared mapper)
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
