import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUserTierDetailService } from '../../application/get-user-tier-detail.service';
import { GetUserTierHistoryService } from '../../application/get-user-tier-history.service';
import { UpdateUserTierCustomService } from '../../application/update-user-tier-custom.service';
import { ForceUpdateUserTierService } from '../../application/force-update-user-tier.service';
import { ResetUserTierPerformanceService } from '../../application/reset-user-tier-performance.service';
import { UpdateUserTierStatusService } from '../../application/update-user-tier-status.service';
import { UserTierAdminResponseDto } from './dto/response/user-tier-admin.response.dto';
import { UserTierHistoryAdminResponseDto } from './dto/response/user-tier-history-admin.response.dto';
import { UpdateUserTierCustomRequestDto } from './dto/request/update-user-tier-custom.request.dto';
import { ForceUpdateTierRequestDto } from './dto/request/force-update-tier.request.dto';
import { ListUserTiersQueryDto } from './dto/request/list-user-tiers.query.dto';
import { GetUserTierHistoryQueryDto } from '../user/dto/request/get-user-tier-history.query.dto';
import { ListUserTiersService } from '../../application/list-user-tiers.service';
import { ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { UserTierListItemResponseDto } from './dto/response/user-tier-list.response.dto';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { UpdateUserTierStatusRequestDto } from './dto/request/update-user-tier-status.request.dto';

@ApiTags('Admin User Tiers')
@Controller('admin/user-tiers')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class UserTierAdminController {
  constructor(
    private readonly listUserTiersService: ListUserTiersService,
    private readonly getUserTierDetailService: GetUserTierDetailService,
    private readonly getUserTierHistoryService: GetUserTierHistoryService,
    private readonly updateUserTierCustomService: UpdateUserTierCustomService,
    private readonly forceUpdateUserTierService: ForceUpdateUserTierService,
    private readonly resetUserTierPerformanceService: ResetUserTierPerformanceService,
    private readonly updateUserTierStatusService: UpdateUserTierStatusService,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({ summary: 'List user tiers / 유저 티어 목록 조회' })
  @ApiPaginatedResponse(UserTierListItemResponseDto, {
    description:
      'Successfully retrieved user tier list / 유저 티어 목록 조회 성공',
  })
  async listUserTiers(
    @Query() query: ListUserTiersQueryDto,
  ): Promise<PaginatedData<UserTierListItemResponseDto>> {
    const result = await this.listUserTiersService.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      tierId: query.tierId ? BigInt(query.tierId) : undefined,
      status: query.status,
      search: query.search,
    });

    return {
      ...result,
      data: result.data.map((item) => ({ ...item })),
    };
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user tier details / 유저 티어 상세 정보 조회' })
  @ApiOkResponse({
    type: UserTierAdminResponseDto,
    description:
      'Successfully retrieved user tier details / 유저 티어 상세 정보 조회 성공',
  })
  async getUserTierDetail(
    @Param('userId') userId: string,
  ): Promise<UserTierAdminResponseDto> {
    const result = await this.getUserTierDetailService.execute(BigInt(userId));
    return { ...result };
  }

  @Get('users/:userId/history')
  @ApiOperation({ summary: 'Get user tier history / 유저 티어 변경 이력 조회' })
  @Paginated()
  @ApiPaginatedResponse(UserTierHistoryAdminResponseDto, {
    description:
      'Successfully retrieved user tier history / 유저 티어 변경 이력 조회 성공',
  })
  async getUserTierHistory(
    @Param('userId') userId: string,
    @Query() query: GetUserTierHistoryQueryDto,
  ): Promise<PaginatedData<UserTierHistoryAdminResponseDto>> {
    const history = await this.getUserTierHistoryService.execute(
      BigInt(userId),
      query,
    );

    return {
      data: history.data.map((h) => ({
        id: h.id.toString(),
        fromTierId: h.fromTierId?.toString() ?? null,
        toTierId: h.toTierId.toString(),
        changeType: h.changeType,
        reason: h.reason,
        changedAt: h.changedAt,
        statusExpSnap: h.statusExpSnap.toString(),
        upgradeBonusSnap: h.upgradeBonusSnap.toString(),
        currency: h.currency,
      })),
      page: history.page,
      limit: history.limit,
      total: history.total,
    };
  }

  @Patch('users/:userId/custom')
  @ApiOperation({
    summary: 'Update custom tier benefits / 개별 티어 혜택 수정',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'TIER',
    action: 'UPDATE_CUSTOM_BENEFITS',
    extractMetadata: (req) => ({ userId: req.params.userId, body: req.body }),
  })
  @ApiOkResponse({
    description: 'Successfully updated custom benefits / 개별 혜택 수정 성공',
  })
  async updateUserTierCustom(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserTierCustomRequestDto,
  ): Promise<void> {
    return this.updateUserTierCustomService.execute(BigInt(userId), dto);
  }

  @Post('users/:userId/force-update')
  @ApiOperation({ summary: 'Force update user tier / 티어 강제 업데이트' })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'TIER',
    action: 'FORCE_UPDATE_TIER',
    extractMetadata: (req) => ({ userId: req.params.userId, body: req.body }),
  })
  @ApiOkResponse({
    description:
      'Successfully force updated user tier / 티어 강제 업데이트 성공',
  })
  async forceUpdateUserTier(
    @Param('userId') userId: string,
    @Body() dto: ForceUpdateTierRequestDto,
  ): Promise<void> {
    return this.forceUpdateUserTierService.execute(
      BigInt(userId),
      BigInt(dto.targetTierId),
      dto.reason,
      dto.isGrantBonus ?? false,
    );
  }

  @Post('users/:userId/reset')
  @ApiOperation({
    summary: 'Reset performance for current period / 현재 주기 실적 초기화',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'TIER',
    action: 'RESET_PERFORMANCE',
    extractMetadata: (req) => ({ userId: req.params.userId }),
  })
  @ApiOkResponse({
    description: 'Successfully reset performance / 실적 초기화 성공',
  })
  async resetUserTierPerformance(
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.resetUserTierPerformanceService.execute(BigInt(userId));
  }

  @Patch('users/:userId/status')
  @ApiOperation({
    summary: 'Update user tier status (Lock/Unlock) / 유저 티어 상태 변경',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'TIER',
    action: 'UPDATE_STATUS',
    extractMetadata: (req) => ({ userId: req.params.userId, body: req.body }),
  })
  @ApiOkResponse({
    description: 'Successfully updated status / 상태 변경 성공',
  })
  async updateUserTierStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserTierStatusRequestDto,
  ): Promise<void> {
    return this.updateUserTierStatusService.execute({
      userId: BigInt(userId),
      status: dto.status,
      reason: dto.reason,
    });
  }
}
