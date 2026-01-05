// src/modules/wallet/controllers/admin/wallet-admin.controller.ts
import {
  Controller,
  Get,
  Patch,
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
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { GetUserBalanceAdminService } from '../../application/get-user-balance-admin.service';
import { UpdateUserBalanceAdminService } from '../../application/update-user-balance-admin.service';
import { AdminUserBalanceResponseDto } from './dto/response/admin-user-balance.response.dto';
import { UpdateUserBalanceResponseDto } from './dto/response/update-user-balance.response.dto';
import { GetUserBalanceQueryDto } from './dto/request/get-user-balance-query.dto';
import { UpdateUserBalanceRequestDto } from './dto/request/update-user-balance.request.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { Prisma } from '@repo/database';
import { GetWalletTransactionHistoryAdminService } from '../../application/get-wallet-transaction-history-admin.service';
import {
  WalletTransactionResponseDto,
} from './dto/response/wallet-transaction.response.dto';
import { GetWalletTransactionHistoryQueryDto } from './dto/request/get-wallet-transaction-history-query.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain';

@Controller('admin/wallet')
@ApiTags('Admin Wallet')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class WalletAdminController {
  constructor(
    private readonly getUserBalanceAdminService: GetUserBalanceAdminService,
    private readonly updateUserBalanceAdminService: UpdateUserBalanceAdminService,
    private readonly getWalletTransactionHistoryAdminService: GetWalletTransactionHistoryAdminService,
  ) { }

  /**
   * 사용자 잔액 조회 (관리자용)
   */
  @Get('users/:userId/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user balance / 사용자 잔액 조회 (관리자용)',
    description: '관리자가 특정 사용자의 잔액을 조회합니다. 통화를 지정하지 않으면 모든 통화의 잔액을 반환합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    type: String,
  })
  @ApiStandardResponse(AdminUserBalanceResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved user balance / 사용자 잔액 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'VIEW_USER_BALANCE',
    extractMetadata: (req, args) => ({
      targetUserId: args[0], // userId param
      currency: args[1]?.currency, // query param
    }),
  })
  async getUserBalance(
    @Param('userId') userId: string,
    @Query() query: GetUserBalanceQueryDto,
  ): Promise<AdminUserBalanceResponseDto> {
    const result = await this.getUserBalanceAdminService.execute({
      userId: BigInt(userId),
      currency: query.currency,
    });

    const walletArray = Array.isArray(result.wallet)
      ? result.wallet
      : [result.wallet];

    return {
      userId,
      wallets: walletArray.map((wallet) => ({
        currency: wallet.currency,
        mainBalance: wallet.mainBalance.toString(),
        bonusBalance: wallet.bonusBalance.toString(),
        totalBalance: wallet.totalBalance.toString(),
        updatedAt: wallet.updatedAt,
      })),
    };
  }

  /**
   * 사용자 잔액 업데이트 (관리자용)
   */
  @Patch('users/:userId/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user balance / 사용자 잔액 업데이트 (관리자용)',
    description:
      '관리자가 특정 사용자의 잔액을 증가 또는 감소시킵니다. 메인 잔액, 보너스 잔액, 또는 총 잔액에 대해 추가 또는 차감 연산을 수행할 수 있습니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    type: String,
    example: '1234567890123456789',
  })
  @ApiStandardResponse(UpdateUserBalanceResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully updated user balance / 사용자 잔액 업데이트 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'UPDATE_USER_BALANCE',
    extractMetadata: (req, args) => ({
      targetUserId: args[0], // userId param
      ...args[1],            // updateDto body
    }),
  })
  async updateUserBalance(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserBalanceRequestDto,
    @CurrentUser() admin: User,
  ): Promise<UpdateUserBalanceResponseDto> {
    const result = await this.updateUserBalanceAdminService.execute({
      userId: BigInt(userId),
      currency: updateDto.currency,
      balanceType: updateDto.balanceType,
      operation: updateDto.operation,
      amount: new Prisma.Decimal(updateDto.amount),
      adminUserId: admin.id!,
      reasonCode: updateDto.reasonCode,
      internalNote: updateDto.internalNote,
    });

    return {
      userId,
      currency: result.wallet.currency,
      beforeMainBalance: result.beforeMainBalance.toString(),
      afterMainBalance: result.afterMainBalance.toString(),
      beforeBonusBalance: result.beforeBonusBalance.toString(),
      afterBonusBalance: result.afterBonusBalance.toString(),
      mainBalanceChange: result.mainBalanceChange.toString(),
      bonusBalanceChange: result.bonusBalanceChange.toString(),
      totalBalance: result.wallet.totalBalance.toString(),
      updatedAt: result.wallet.updatedAt,
    };
  }
  @Get('users/:userId/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet transaction history / 지갑 트랜잭션 이력 조회 (관리자용)',
    description: '특정 사용자의 지갑 트랜잭션 이력을 조회합니다. 통화, 타입, 날짜 등의 필터링과 페이지네이션을 지원합니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    type: String,
  })
  @ApiPaginatedResponse(WalletTransactionResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved transaction history / 트랜잭션 이력 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'ADMIN',
    action: 'VIEW_WALLET_TRANSACTIONS',
    extractMetadata: (req, args) => ({
      targetUserId: args[0],
      ...args[1], // query params
    }),
  })
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query() query: GetWalletTransactionHistoryQueryDto,
  ): Promise<{ data: WalletTransactionResponseDto[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.getWalletTransactionHistoryAdminService.execute({
      userId: BigInt(userId),
      currency: query.currency,
      type: query.type,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page,
      limit,
    });

    return {
      data: items.map((tx) => ({
        id: tx.id?.toString() || '',
        userId: tx.userId.toString(),
        type: tx.type,
        status: tx.status,
        currency: tx.currency,
        amount: tx.amount.toString(),
        beforeAmount: tx.beforeAmount.toString(),
        afterAmount: tx.afterAmount.toString(),
        balanceDetail: {
          mainBalanceChange: tx.balanceDetail.mainBalanceChange.toString(),
          mainBeforeAmount: tx.balanceDetail.mainBeforeAmount.toString(),
          mainAfterAmount: tx.balanceDetail.mainAfterAmount.toString(),
          bonusBalanceChange: tx.balanceDetail.bonusBalanceChange.toString(),
          bonusBeforeAmount: tx.balanceDetail.bonusBeforeAmount.toString(),
          bonusAfterAmount: tx.balanceDetail.bonusAfterAmount.toString(),
        },
        adminDetail: tx.adminDetail
          ? {
            adminUserId: tx.adminDetail.adminUserId.toString(),
            reasonCode: tx.adminDetail.reasonCode,
            internalNote: tx.adminDetail.internalNote,
          }
          : undefined,
        systemDetail: tx.systemDetail
          ? {
            serviceName: tx.systemDetail.serviceName,
            triggerId: tx.systemDetail.triggerId,
            actionName: tx.systemDetail.actionName,
            metadata: tx.systemDetail.metadata,
          }
          : undefined,
        createdAt: tx.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}

