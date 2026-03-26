import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { GetUserArtifactLogAdminQueryDto } from './dto/request/get-user-artifact-log-admin-query.dto';
import { UserArtifactLogAdminSummaryResponseDto } from './dto/response/user-artifact-log-admin-list.response.dto';
import { GetArtifactBonusPoolLogAdminQueryDto } from './dto/request/get-artifact-bonus-pool-log-admin-query.dto';
import { ArtifactBonusPoolLogAdminSummaryResponseDto } from './dto/response/artifact-bonus-pool-log-admin-list.response.dto';

/**
 * [Audit Admin] 유물 관련 감사 로그 컨트롤러
 */
@ApiTags('Admin Artifact Audit')
@Controller('admin/artifact/audit')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class ArtifactAuditAdminController {
  /**
   * [GET] 유저별 유물 활동 로그 조회
   */
  @Get('user-logs')
  @ApiOperation({
    summary: 'Get User Artifact Activity Logs / 유저별 유물 활동 로그 조회',
    description: 'Retrieve artifact activity logs of users with filtering and pagination. / 필터링 및 페이지네이션을 지원하는 유저 유물 활동 로그 조회'
  })
  @ApiPaginatedResponse(UserArtifactLogAdminSummaryResponseDto)
  async getUserLogs(
    @Query() query: GetUserArtifactLogAdminQueryDto,
  ): Promise<PaginatedData<UserArtifactLogAdminSummaryResponseDto>> {
    return {
      data: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  /**
   * [GET] 보너스 풀 변동 로그 조회
   */
  @Get('bonus-logs')
  @ApiOperation({
    summary: 'Get Artifact Bonus Pool Logs / 유물 보너스 풀 변동 로그 조회',
    description: 'Retrieve logs of artifact bonus pool fluctuations. / 유물 보너스 풀의 변동 내역(적립/분배) 로그 조회'
  })
  @ApiPaginatedResponse(ArtifactBonusPoolLogAdminSummaryResponseDto)
  async getBonusLogs(
    @Query() query: GetArtifactBonusPoolLogAdminQueryDto,
  ): Promise<PaginatedData<ArtifactBonusPoolLogAdminSummaryResponseDto>> {
    return {
      data: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }
}
