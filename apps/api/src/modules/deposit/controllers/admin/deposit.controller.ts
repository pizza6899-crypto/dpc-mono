import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType, Prisma } from '@prisma/client';
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
import { GetDepositsQueryDto } from './dto/request/get-deposits-query.dto';
import { ApproveFiatDepositDto } from './dto/request/approve-fiat-deposit.dto';
import { RejectDepositDto } from './dto/request/reject-deposit.dto';
import {
  AdminDepositListItemDto,
  ApproveDepositResponseDto,
  RejectDepositResponseDto,
} from './dto/response/deposit.response.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetDepositStatsService } from '../../application/get-deposit-stats.service';
import { GetDepositsService } from '../../application/get-deposits.service';
import { GetDepositDetailService } from '../../application/get-deposit-detail.service';
import { ApproveDepositService } from '../../application/approve-deposit.service';
import { RejectDepositService } from '../../application/reject-deposit.service';
import { DepositStatsResponseDto } from './dto/response/deposit-stats.response.dto';

@Controller('admin/deposits')
@ApiTags('Admin Deposit Management')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class AdminDepositController {
  constructor(
    private readonly getDepositStatsService: GetDepositStatsService,
    private readonly getDepositsService: GetDepositsService,
    private readonly getDepositDetailService: GetDepositDetailService,
    private readonly approveDepositService: ApproveDepositService,
    private readonly rejectDepositService: RejectDepositService,
  ) { }

  // ============================================
  // 입금 관리 (Deposit Management)
  // ============================================

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '입금 현황 요약 / Get deposit statistics',
    description:
      '당일 총 입금액, 대기 중인 요청 수, 수단별 분포를 포함한 실시간 입금 통계를 조회합니다. / Get real-time deposit statistics including total deposit amount today, pending requests count, and method distribution.',
  })
  @ApiStandardResponse(DepositStatsResponseDto, {
    status: 200,
    description: '입금 통화 조회 성공 / Deposit statistics retrieved successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_STATS',
    category: 'DEPOSIT',
  })
  async getDepositStats(
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<DepositStatsResponseDto> {
    return await this.getDepositStatsService.execute();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: '입금 목록 조회 / Get deposit list',
    description: '페이징 및 필터링을 지원하는 입금 내역 목록을 조회합니다. / Retrieve deposit history with pagination and filtering support.',
  })
  @ApiPaginatedResponse(AdminDepositListItemDto, {
    status: 200,
    description: '입금 목록 조회 성공 / Deposit list retrieved successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_LIST',
    category: 'DEPOSIT',
  })
  async getDeposits(
    @Query() query: GetDepositsQueryDto,
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedData<AdminDepositListItemDto>> {
    const result = await this.getDepositsService.execute({
      query: {
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        status: query.status,
        methodType: query.methodType,
        userId: query.userId,
        currency: query.currency,
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
    return {
      data: result.data.map((item) => ({
        id: item.deposit.id!.toString(),
        userId: item.deposit.userId,
        userEmail: item.userEmail || '',
        status: item.deposit.status,
        methodType: item.deposit.getMethod().methodType,
        provider: item.deposit.getMethod().provider,
        depositCurrency: item.deposit.depositCurrency,
        createdAt: item.deposit.createdAt,
        updatedAt: item.deposit.updatedAt,
        failureReason: item.deposit.failureReason || '',
      })),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '입금 상세 조회 / Get deposit detail',
    description: '특정 입금의 상세 정보를 조회합니다. / Retrieve detailed information of a specific deposit.',
  })
  @ApiParam({
    name: 'id',
    description: '입금 상세 ID / DepositDetail ID',
    type: String,
  })
  @ApiStandardResponse(AdminDepositListItemDto, {
    status: 200,
    description: '입금 상세 조회 성공 / Deposit detail retrieved successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0]?.id || args[0],
    }),
  })
  async getDepositDetail(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AdminDepositListItemDto> {
    const result = await this.getDepositDetailService.execute({
      id: BigInt(id),
    });
    return {
      id: result.deposit.id!.toString(),
      userId: result.deposit.userId,
      userEmail: result.userEmail || '',
      status: result.deposit.status,
      methodType: result.deposit.getMethod().methodType,
      provider: result.deposit.getMethod().provider,
      depositCurrency: result.deposit.depositCurrency,
      createdAt: result.deposit.createdAt,
      updatedAt: result.deposit.updatedAt,
      failureReason: result.deposit.failureReason || '',
    };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '입금 승인 / Approve deposit',
    description: '입금을 승인하고 사용자의 잔액을 업데이트합니다. / Approve a deposit and update user balance.',
  })
  @ApiParam({
    name: 'id',
    description: '입금 상세 ID / DepositDetail ID',
    type: String,
  })
  @ApiStandardResponse(ApproveDepositResponseDto, {
    status: 200,
    description: '입금 승인 성공 / Deposit approved successfully',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'APPROVE_DEPOSIT',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0]?.id || args[0],
      actuallyPaid: args[1]?.actuallyPaid,
      transactionHash: args[1]?.transactionHash,
    }),
  })
  async approveDeposit(
    @Param('id') id: string,
    @Body() dto: ApproveFiatDepositDto,
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ApproveDepositResponseDto> {
    return await this.approveDepositService.execute({
      id: BigInt(id),
      actuallyPaid: new Prisma.Decimal(dto.actuallyPaid),
      transactionHash: dto.transactionHash,
      memo: dto.memo,
      adminId: admin.id,
      requestInfo,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '입금 거부 / Reject deposit',
    description: '입금 요청을 거부 처리합니다. / Reject a deposit request.',
  })
  @ApiParam({
    name: 'id',
    description: '입금 상세 ID / DepositDetail ID',
    type: String,
  })
  @ApiStandardResponse(RejectDepositResponseDto, {
    status: 200,
    description: '입금 거부 성공 / Deposit rejected successfully',
  })
  @AuditLog({
    type: LogType.AUTH,
    action: 'REJECT_DEPOSIT',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0]?.id || args[0],
      failureReason: args[1]?.failureReason,
    }),
  })
  async rejectDeposit(
    @Param('id') id: string,
    @Body() dto: RejectDepositDto,
    @CurrentUser() admin: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<RejectDepositResponseDto> {
    return await this.rejectDepositService.execute({
      id: BigInt(id),
      failureReason: dto.failureReason,
      adminId: admin.id,
    });
  }
}
