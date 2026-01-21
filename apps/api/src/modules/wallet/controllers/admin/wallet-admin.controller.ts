// src/modules/wallet/controllers/admin/wallet-admin.controller.ts

/**
 * [ TODO: Wallet Entity 수정 후 구현 예정 ]
 * 관리자용 지갑 관리 컨트롤러 엔드포인트 설계안:
 * 
 * 1. GET /admin/wallets
 *    - 사용자 지갑 목록 조회 (기본 리스트)
 *    - 필터: userId, currency, status
 *    - 상세 조회 통합: 특정 userId나 walletId 조건 시 상세 정보 포함
 * 
 * 2. GET /admin/wallets/statistics
 *    - 시스템 전체 보유 자산 합계 조회 (통계)
 *    - 타입별(Cash, Bonus 등), 통화별 요약 정보 제공
 * 
 * 3. POST /admin/wallets/adjust
 *    - 관리자 수동 잔액 조정 (수동 지급/차감)
 *    - 사유(reasonCode), 내부 비고(internalNote) 필수 기록
 * 
 * 4. GET /admin/wallets/transactions
 *    - 시스템 전체 트랜잭션 이력 조회
 *    - 필터: userId, referenceId(게임/결제 ID), type, 기간 검색
 * 
 * 5. PATCH /admin/wallets/:userId/status
 *    - 지갑 상태 관리 (비정상 유저 지갑 잠금/해제 등)
 */
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
import { Admin } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { User } from 'src/modules/user/domain';
import { UserBalanceService } from '../../application/user-balance.service';
import { WalletQueryService } from '../../application/wallet-query.service';
import { AdminUserBalanceResponseDto } from './dto/response/admin-user-balance.response.dto';
import { UpdateUserBalanceResponseDto } from './dto/response/update-user-balance.response.dto';
import { GetUserBalanceQueryDto } from './dto/request/get-user-balance-query.dto';
import { UpdateUserBalanceRequestDto } from './dto/request/update-user-balance.request.dto';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { Prisma, WalletTransactionType, WalletBalanceType } from '@prisma/client';
import { WalletTransactionResponseDto } from './dto/response/wallet-transaction.response.dto';
import { GetWalletTransactionHistoryQueryDto } from './dto/request/get-wallet-transaction-history-query.dto';
import { GetWalletTransactionHistoryService } from '../../application/get-wallet-transaction-history.service';
import { UserWallet } from '../../domain';
import { UpdateOperation } from '../../domain/wallet.constant';

@Controller('admin/wallet')
@ApiTags('Admin Wallet')
@Admin()
@ApiStandardErrors()
export class WalletAdminController {
  constructor(
    private readonly userBalanceService: UserBalanceService,
    private readonly walletQueryService: WalletQueryService,
    private readonly getWalletTransactionHistoryService: GetWalletTransactionHistoryService,
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
    const uid = BigInt(userId);
    let wallets: UserWallet[] = [];

    if (query.currency) {
      const wallet = await this.walletQueryService.getWallet(uid, query.currency);
      if (wallet) wallets.push(wallet);
    } else {
      wallets = await this.walletQueryService.getWallets(uid);
    }

    return {
      userId,
      wallets: wallets.map((wallet) => ({
        currency: wallet.currency,
        mainBalance: wallet.cash.toString(),
        bonusBalance: wallet.bonus.toString(),
        rewardBalance: wallet.reward.toString(),
        lockedBalance: wallet.lock.toString(),
        vaultBalance: wallet.vault.toString(),
        totalBalance: wallet.totalAvailableBalance.toString(),
        status: wallet.status,
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
    const amount = new Prisma.Decimal(updateDto.amount);

    const wallet = await this.userBalanceService.updateBalance({
      userId: BigInt(userId),
      currency: updateDto.currency,
      balanceType: updateDto.balanceType,
      operation: updateDto.operation,
      transactionType: WalletTransactionType.ADJUSTMENT,
      amount: amount,
    }, {
      adminUserId: admin.id!,
      reasonCode: updateDto.reasonCode,
      internalNote: updateDto.internalNote,
    });

    // Calculate changes for response
    let cashChange = new Prisma.Decimal(0);
    let bonusChange = new Prisma.Decimal(0);
    let beforeCash = wallet.cash;
    let beforeBonus = wallet.bonus;

    if (updateDto.balanceType === WalletBalanceType.CASH) {
      cashChange = updateDto.operation === UpdateOperation.ADD ? amount : amount.neg();
      beforeCash = wallet.cash.sub(cashChange);
    } else if (updateDto.balanceType === WalletBalanceType.BONUS) {
      bonusChange = updateDto.operation === UpdateOperation.ADD ? amount : amount.neg();
      beforeBonus = wallet.bonus.sub(bonusChange);
    }

    return {
      userId,
      currency: wallet.currency,
      beforeMainBalance: beforeCash.toString(),
      afterMainBalance: wallet.cash.toString(),
      beforeBonusBalance: beforeBonus.toString(),
      afterBonusBalance: wallet.bonus.toString(),
      mainBalanceChange: cashChange.toString(),
      bonusBalanceChange: bonusChange.toString(),
      totalBalance: wallet.totalAvailableBalance.toString(),
      updatedAt: wallet.updatedAt,
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

    const { items, total } = await this.getWalletTransactionHistoryService.execute({
      userId: BigInt(userId),
      currency: query.currency,
      type: query.type,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page,
      limit,
    });

    return {
      data: items.map((tx) => {
        const afterAmount = tx.balanceAfter;
        // tx.amount has a sign? Usually it does if from DB.
        // Entity create logic might store signed amount.
        // Let's assume tx.amount is signed.
        const beforeAmount = afterAmount.sub(tx.amount);

        const isCash = tx.balanceType === WalletBalanceType.CASH;
        const isBonus = tx.balanceType === WalletBalanceType.BONUS;

        return {
          id: tx.id?.toString() || '',
          userId: tx.userId.toString(),
          type: tx.type,
          status: 'SUCCESS', // New schema doesn't have status, assuming SUCCESS
          currency: tx.currency,
          amount: tx.amount.toString(),
          beforeAmount: beforeAmount.toString(),
          afterAmount: afterAmount.toString(),
          balanceDetail: {
            mainBalanceChange: isCash ? tx.amount.toString() : '0',
            mainBeforeAmount: isCash ? beforeAmount.toString() : '0', // Approximation
            mainAfterAmount: isCash ? afterAmount.toString() : '0', // Approximation
            bonusBalanceChange: isBonus ? tx.amount.toString() : '0',
            bonusBeforeAmount: isBonus ? beforeAmount.toString() : '0',
            bonusAfterAmount: isBonus ? afterAmount.toString() : '0',
          },
          adminDetail: undefined, // Structure changed
          systemDetail: undefined, // Structure changed
          createdAt: tx.createdAt,
        };
      }),
      total,
      page,
      limit,
    };
  }
}

