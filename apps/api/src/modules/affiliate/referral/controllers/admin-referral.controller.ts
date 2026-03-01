// src/modules/affiliate/referral/controllers/admin-referral.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { AdminReferralService } from '../application/admin-referral.service';
import { GetReferralsQueryDto } from './dto/request/get-referrals-query.dto';
import { AdminReferralListItemDto } from './dto/response/admin-referral-response.dto';

import { LogType } from 'src/modules/audit-log/domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';

@Controller('admin/affiliate/referrals')
@ApiTags('Admin Referral Management')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminReferralController {
  constructor(private readonly adminReferralService: AdminReferralService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'ADMIN_REFERRAL_LIST_VIEW',
    extractMetadata: (_, args, result) => ({
      query: args[0], // GetReferralsQueryDto
      count: result?.data?.length ?? 0,
      total: result?.total ?? 0,
    }),
  })
  @ApiOperation({
    summary: 'Get referral list / 레퍼럴 목록 조회',
    description:
      'Retrieve referral relationships with pagination and filtering support. (관리자가 레퍼럴 관계 목록을 조회합니다. 페이징 및 필터링을 지원합니다.)',
  })
  @ApiPaginatedResponse(AdminReferralListItemDto, {
    status: 200,
    description: 'Referral list retrieved successfully / 레퍼럴 목록 조회 성공',
  })
  async getReferrals(
    @Query() query: GetReferralsQueryDto,
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminReferralListItemDto>> {
    return await this.adminReferralService.getReferrals(
      query,
      admin.id,
      requestInfo,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'AFFILIATE',
    action: 'ADMIN_REFERRAL_DETAIL_VIEW',
    extractMetadata: (_, args, result) => ({
      referralId: args[0],
      affiliateId: result?.affiliateId,
    }),
  })
  @ApiOperation({
    summary: 'Get referral detail / 레퍼럴 상세 조회',
    description:
      'Retrieve a specific referral relationship by ID. (관리자가 특정 레퍼럴 관계의 상세 정보를 조회합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'Referral ID / 레퍼럴 ID',
    type: String,
  })
  @ApiStandardResponse(AdminReferralListItemDto, {
    status: 200,
    description:
      'Referral detail retrieved successfully / 레퍼럴 상세 조회 성공',
  })
  async getReferralById(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AdminReferralListItemDto> {
    return await this.adminReferralService.getReferralById(
      BigInt(id),
      admin.id,
    );
  }
}
