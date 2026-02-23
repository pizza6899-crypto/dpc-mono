import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { AdjustUserBalanceService } from '../../application/adjust-user-balance.service';
import { UpdateWalletStatusService } from '../../application/update-wallet-status.service';
import { FindUserWalletsService } from '../../application/find-user-wallets.service';
import { FindWalletStatisticsService } from '../../application/find-wallet-statistics.service';
import { FindWalletTransactionHistoryService } from '../../application/find-wallet-transaction-history.service';
import { AdminFindWalletsQueryDto } from './dto/request/admin-find-wallets-query.dto';
import { AdminAdjustBalanceRequestDto } from './dto/request/admin-adjust-balance.request.dto';
import { AdminUpdateWalletStatusRequestDto } from './dto/request/admin-update-wallet-status.request.dto';
import { AdminTransactionQueryDto } from './dto/request/admin-transaction-query.dto';
import { AdminWalletResponseDto } from './dto/response/admin-wallet-list.response.dto';
import { AdjustBalanceResponseDto } from './dto/response/adjust-balance.response.dto';
import { UpdateWalletStatusResponseDto } from './dto/response/update-wallet-status.response.dto';
import { WalletStatisticsResponseDto } from './dto/response/wallet-statistics.response.dto';
import { WalletTransactionResponseDto } from './dto/response/wallet-transaction.response.dto';
import { Prisma } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@ApiTags('Admin Wallet')
@Controller('admin/wallets')
@Admin()
@ApiStandardErrors()
export class WalletAdminController {
  constructor(
    private readonly findUserWalletsService: FindUserWalletsService,
    private readonly findWalletStatisticsService: FindWalletStatisticsService,
    private readonly adjustUserBalanceService: AdjustUserBalanceService,
    private readonly updateWalletStatusService: UpdateWalletStatusService,
    private readonly findWalletTransactionHistoryService: FindWalletTransactionHistoryService,
  ) { }

  /**
   * 1. 사용자 지갑 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user wallets / 사용자 지갑 목록 조회',
    description:
      '시스템의 모든 사용자 지갑 목록을 조회합니다. 필터링과 페이지네이션을 지원합니다.',
  })
  @ApiPaginatedResponse(AdminWalletResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved wallets / 지갑 목록 조회 성공',
  })
  async listWallets(
    @Query() query: AdminFindWalletsQueryDto,
  ): Promise<PaginatedData<AdminWalletResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.findUserWalletsService.execute({
      userId: query.userId ? BigInt(query.userId) : undefined,
      currency: query.currency,
      status: query.status,
      page,
      limit,
    });

    return {
      data: items.map((w) => ({
        userId: w.userId.toString(),
        currency: w.currency,
        cashBalance: w.cash.toString(),
        bonusBalance: w.bonus.toString(),
        lockedBalance: w.lock.toString(),
        vaultBalance: w.vault.toString(),
        totalBalance: w.totalAvailableBalance.toString(),
        status: w.status,
        updatedAt: w.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 2. 시스템 전체 보유 자산 통계
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet statistics / 시스템 전체 보유 자산 통계',
    description: '시스템 전체의 통화별/타입별 자산 합계 정보를 제공합니다.',
  })
  @ApiStandardResponse(WalletStatisticsResponseDto, {
    status: HttpStatus.OK,
  })
  async getStatistics(): Promise<WalletStatisticsResponseDto> {
    const stats = await this.findWalletStatisticsService.execute();
    return {
      statistics: stats.map((s: any) => ({
        currency: s.currency,
        totalCash: s.totalCash.toString(),
        totalBonus: s.totalBonus.toString(),
        totalLock: s.totalLock.toString(),
        totalVault: s.totalVault.toString(),
        userCount: s.userCount,
      })),
    };
  }

  /**
   * 3. 관리자 수동 잔액 조정
   */
  /*
  // [보안 주의] 
  // 관리자가 다이렉트로 지갑 잔고를 만지면(Adjust) 롤링(Wagering) 및 보상 정산 로직의 정합성이 훼손될 수 있어 잠정 차단(주석 처리)함.
  // 추후 검토를 거쳐 필요한 기능만 남기거나 복구할 예정입니다.
  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually adjust balance / 관리자 수동 잔액 조정',
    description:
      '관리자가 특정 사용자의 잔액을 수동으로 추가하거나 차감합니다.',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'ADJUST_BALANCE',
    extractMetadata: (req, args) => ({
      ...args[0], // AdjustBalanceRequestDto
    }),
  })
  async adjustBalance(
    @Body() dto: AdminAdjustBalanceRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
  ): Promise<AdjustBalanceResponseDto> {
    const wallet = await this.adjustUserBalanceService.execute({
      userId: BigInt(dto.userId),
      currency: dto.currency,
      amount: new Prisma.Decimal(dto.amount),
      operation: dto.operation,
      balanceType: dto.balanceType,
      adminId: admin.id,
      reasonCode: dto.reasonCode,
      remark: dto.remark,
    });

    return {
      userId: wallet.userId.toString(),
      currency: wallet.currency,
      newBalance: {
        cash: wallet.cash.toString(),
        bonus: wallet.bonus.toString(),
        total: wallet.totalAvailableBalance.toString(),
      },
      updatedAt: wallet.updatedAt,
    };
  }
  */

  /**
   * 4. 시스템 전체 트랜잭션 이력 조회
   */
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all transactions / 시스템 전체 트랜잭션 이력 조회',
    description:
      '시스템 전체의 트랜잭션 이력을 조회합니다. 필터링을 지원합니다.',
  })
  @ApiPaginatedResponse(WalletTransactionResponseDto, {
    status: HttpStatus.OK,
  })
  async getTransactionHistory(
    @Query() query: AdminTransactionQueryDto,
  ): Promise<PaginatedData<WalletTransactionResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } =
      await this.findWalletTransactionHistoryService.execute({
        userId: query.userId ? BigInt(query.userId) : undefined,
        currency: query.currency,
        type: query.type,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        page,
        limit,
      });

    return {
      data: items.map((tx) => {
        // Metadata 파싱 및 매핑
        // Metadata 파싱 및 매핑
        const metadata = (tx.metadata || {}) as any;

        return {
          id: tx.id?.toString() || '',
          userId: tx.userId.toString(),
          type: tx.type,
          status: 'COMPLETED',
          currency: tx.currency,
          amount: tx.amount.abs().toString(), // 응답 DTO 정의상 절대값 반환
          beforeAmount: tx.balanceBefore.toString(),
          afterAmount: tx.balanceAfter.toString(),
          balanceDetail: metadata.balanceDetail || {
            // 구형 데이터 호환성 처리: 메타데이터가 없는 경우 현재 트랜잭션 정보를 바탕으로 역산
            mainBalanceChange:
              tx.balanceType === 'CASH' ? tx.amount.toString() : '0',
            mainBeforeAmount:
              tx.balanceType === 'CASH' ? tx.balanceBefore.toString() : '0',
            mainAfterAmount:
              tx.balanceType === 'CASH' ? tx.balanceAfter.toString() : '0',
            bonusBalanceChange:
              tx.balanceType === 'BONUS' ? tx.amount.toString() : '0',
            bonusBeforeAmount:
              tx.balanceType === 'BONUS' ? tx.balanceBefore.toString() : '0',
            bonusAfterAmount:
              tx.balanceType === 'BONUS' ? tx.balanceAfter.toString() : '0',
          },
          adminDetail: metadata.adminId
            ? {
              adminUserId: metadata.adminId,
              reasonCode: metadata.reasonCode,
              internalNote: metadata.internalNote || metadata.remark,
            }
            : undefined,
          systemDetail: metadata.serviceName
            ? {
              serviceName: metadata.serviceName,
              triggerId: metadata.triggerId,
              actionName: metadata.actionName,
              metadata: metadata.metadata,
            }
            : undefined,
          createdAt: tx.createdAt,
        };
      }),
      total,
      page,
      limit,
    };
  }

  /**
   * 5. 지갑 상태 관리
   */
  @Patch(':userId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update wallet status / 지갑 상태 관리',
    description: '사용자 지갑의 상태(활성, 동결 등)를 변경합니다.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'UPDATE_WALLET_STATUS',
    extractMetadata: (req, args) => ({
      targetUserId: args[0],
      ...args[1],
    }),
  })
  async updateStatus(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateWalletStatusRequestDto,
    @CurrentUser() admin: CurrentUserWithSession,
  ): Promise<UpdateWalletStatusResponseDto> {
    const wallet = await this.updateWalletStatusService.execute({
      userId: BigInt(userId),
      currency: dto.currency,
      newStatus: dto.newStatus,
      adminId: admin.id,
      reason: dto.reason,
    });

    return {
      userId: wallet.userId.toString(),
      currency: wallet.currency,
      status: wallet.status,
      updatedAt: wallet.updatedAt,
    };
  }
}
