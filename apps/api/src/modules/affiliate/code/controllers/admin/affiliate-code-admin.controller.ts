// src/modules/affiliate/code/controllers/admin/affiliate-code-admin.controller.ts
import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import type { PaginatedData } from 'src/common/http/types';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { FindCodesAdminService } from '../../application/find-codes-admin.service';
import { FindCodesQueryDto } from './dto/request/find-codes-query.dto';
import { AdminCodeListItemDto } from './dto/response/admin-code-list.response.dto';
import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

@Controller('admin/affiliate-codes')
@ApiTags('Admin Affiliate Codes (관리자 어플리에이트 코드 관리)')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AffiliateCodeAdminController {
  constructor(
    private readonly findCodesAdminService: FindCodesAdminService,
  ) { }

  /**
   * 어플리에이트 코드 목록 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'AFFILIATE_CODE_ADMIN_LIST_VIEW',
    extractMetadata: (args, result) => ({
      query: args[0], // FindCodesQueryDto
      count: result?.data?.length ?? 0,
      total: result?.total ?? 0,
    }),
  })
  @Paginated()
  @ApiOperation({
    summary: 'Get affiliate codes list / 어플리에이트 코드 목록 조회 (관리자용)',
    description:
      '관리자가 모든 어플리에이트 코드를 조회합니다. 페이징, 필터링, 정렬 기능을 지원합니다.',
  })
  @ApiPaginatedResponse(AdminCodeListItemDto, {
    status: 200,
    description:
      'Successfully retrieved affiliate codes list / 어플리에이트 코드 목록 조회 성공',
  })
  async listCodes(
    @Query() query: FindCodesQueryDto,
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminCodeListItemDto>> {
    const result = await this.findCodesAdminService.execute({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      userId: query.userId,
      code: query.code,
      isActive: query.isActive,
      isDefault: query.isDefault,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      data: result.data.map((code) => ({
        id: code.id,
        userId: code.userId.toString(),
        code: code.code,
        campaignName: code.campaignName,
        isActive: code.isActive,
        isDefault: code.isDefault,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
        updatedAt: code.updatedAt,
        lastUsedAt: code.lastUsedAt,
      })),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }
}

