// src/modules/affiliate/referral/controllers/admin-referral.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/platform/auth/guards/session-auth.guard';
import { RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/platform/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/platform/http/types';
import { Paginated } from 'src/platform/http/decorators/paginated.decorator';
import { AdminReferralService } from '../application/admin-referral.service';
import { GetReferralsQueryDto } from './dto/request/get-referrals-query.dto';
import { AdminReferralListItemDto } from './dto/response/admin-referral-response.dto';

@Controller('admin/affiliate/referrals')
@ApiTags('Admin Referral Management (관리자 레퍼럴 관리)')
@ApiStandardErrors()
@UseGuards(SessionAuthGuard)
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminReferralController {
  constructor(private readonly adminReferralService: AdminReferralService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
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
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminReferralListItemDto>> {
    return await this.adminReferralService.getReferrals(
      query,
      admin.id,
      requestInfo,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
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
    @CurrentUser() admin: CurrentUserWithSession,
    @RequestClienttInfo() requestInfo: RequestClientInfo,
  ): Promise<AdminReferralListItemDto> {
    return await this.adminReferralService.getReferralById(
      id,
      admin.id,
      requestInfo,
    );
  }
}
