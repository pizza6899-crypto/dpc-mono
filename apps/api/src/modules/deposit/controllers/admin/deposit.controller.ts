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
    summary: 'Get deposit list / 입금 목록 조회',
    description: `
### [ English ]
#### 1. Deposit Lifecycle
- **Bank Transfer (Fiat/Manual)**: \`PENDING\` -> \`PROCESSING\` -> \`COMPLETED\` / \`REJECTED\`
- **Crypto Wallet (Automatic)**: \`PENDING\` -> \`CONFIRMING\` -> \`COMPLETED\`

#### 2. Status Definitions
- **PENDING**: Initial state. Waiting for actual fund arrival.
- **PROCESSING**: [Fiat Manual Only] Preempted by an admin to prevent duplicate work.
- **CONFIRMING**: [Crypto Auto Only] Waiting for blockchain network confirmations.
- **COMPLETED**: Final success. Funds credited to the user's wallet.
- **FAILED**: Unexpected system/API failure during processing.
- **CANCELED**: Canceled by the user (Only possible in PENDING).
- **EXPIRED**: Auto-expired after the designated timeout period.
- **REJECTED**: Admin rejected the request (e.g., name/amount mismatch).

---

### [ 한글 ]
#### 1. 입금 처리 프로세스
- **무통장 입금 (Fiat/수동)**: \`PENDING(대기 중)\` -> \`PROCESSING(처리 중)\` -> \`COMPLETED(완료)\` / \`REJECTED(거절)\`
- **암호화폐 입금 (Crypto/자동)**: \`PENDING(대기 중)\` -> \`CONFIRMING(확인 중)\` -> \`COMPLETED(완료)\`

#### 2. 상태값 상세 정의
- **PENDING (대기 중)**: 최초 신청 상태. 실제 자금 입금 확인을 기다리는 중입니다.
- **PROCESSING (처리 중)**: **[무통장 수동 전용]** 관리자가 내역 확인을 시작하여 중복 처리를 방지하기 위해 선점한 상태입니다.
- **CONFIRMING (확인 중)**: **[크립토 자동 전용]** 블록체인 네트워크 컨퍼메이션을 대기 중인 상태입니다.
- **COMPLETED (완료)**: 최종 성공. 유저의 자산(Wallet)에 금액이 반영되었습니다.
- **FAILED (실패)**: 처리 중 시스템 오류 또는 외부 API 통신 장애 등으로 실패한 상태입니다.
- **CANCELED (취소됨)**: 유저가 직접 신청을 철회한 상태입니다. (PENDING에서만 가능)
- **EXPIRED (만료됨)**: 지정된 유효 시간 내에 입금이 확인되지 않아 자동 만료된 상태입니다.
- **REJECTED (거절됨)**: 관리자가 확인 후 승인을 거부한 상태입니다. (성함 불일치, 금액 부족 등)
    `,
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
