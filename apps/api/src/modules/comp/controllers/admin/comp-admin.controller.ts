import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  Prisma,
  UserRoleType,
  CompTransactionType,
} from '@prisma/client';
import { FindCompTransactionsService } from '../../application/find-comp-transactions.service';
import { AdminFindCompTransactionsQueryDto } from './dto/request/admin-find-comp-transactions-query.dto';
import { AdminCompTransactionResponseDto } from './dto/response/admin-comp-transaction.response.dto';
import { FindCompBalanceService } from '../../application/find-comp-balance.service';
import { CompConfig } from '../../domain';
import { EarnCompService } from '../../application/earn-comp.service';
import { DeductCompService } from '../../application/deduct-comp.service';
import { FindCompConfigService } from '../../application/find-comp-config.service';
import { UpdateCompConfigService } from '../../application/update-comp-config.service';
import { AdminCompBalanceResponseDto } from './dto/response/admin-comp-balance.response.dto';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  AdminCompAdjustRequestDto,
  AdminCompAdjustType,
} from './dto/request/admin-comp-adjust.request.dto';
import { AdminCompBalanceQueryDto } from './dto/request/admin-comp-balance-query.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { AdminCompAdjustResponseDto } from './dto/response/admin-comp-adjust.response.dto';
import { AdminCompConfigResponseDto } from './dto/response/admin-comp-config.response.dto';
import { AdminUpdateCompConfigDto } from './dto/request/admin-update-comp-config.dto';

@ApiTags('Admin Comp')
@Controller('admin/comp')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CompAdminController {
  constructor(
    private readonly findCompBalanceService: FindCompBalanceService,
    private readonly earnCompService: EarnCompService,
    private readonly deductCompService: DeductCompService,
    private readonly findCompTransactionsService: FindCompTransactionsService,
    private readonly findCompConfigService: FindCompConfigService,
    private readonly updateCompConfigService: UpdateCompConfigService,
  ) { }

  @Get('users/:userId/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user comp balance (Admin) / 사용자 콤프 잔액 조회 (관리자)',
    description:
      "Admin retrieves a specific user's comp balance and statistics / 관리자가 특정 사용자의 콤프 잔액 및 통계를 조회합니다.",
  })
  @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
  @ApiStandardResponse(AdminCompBalanceResponseDto, {
    description:
      'Successfully retrieved user comp balance / 사용자 콤프 잔액 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMP',
    action: 'USER_BALANCE_VIEW',
    extractMetadata: (_, args) => ({
      userId: args[0],
      currency: args[1]?.currency,
    }),
  })
  async getUserBalance(
    @Param('userId') userId: string,
    @Query() query: AdminCompBalanceQueryDto,
  ): Promise<AdminCompBalanceResponseDto> {
    const wallet = await this.findCompBalanceService.execute(
      BigInt(userId),
      query.currency,
    );
    return {
      currency: wallet.currency,
      balance: wallet.balance.toString(),
      totalEarned: wallet.totalEarned.toString(),
      totalUsed: wallet.totalUsed.toString(),
    };
  }

  @Post('users/:userId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Adjust user comp balance (GIVE/DEDUCT) / 사용자 콤프 잔액 조정 (지급/차감)',
    description:
      'Admin manually gives or deducts comp balance from a specific user / 관리자가 특정 사용자의 콤프 잔액을 수동으로 지급하거나 차감합니다.',
  })
  @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
  @ApiStandardResponse(AdminCompAdjustResponseDto, {
    description:
      'Successfully adjusted user comp balance / 사용자 콤프 잔액 조정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMP',
    action: 'ADJUST_BALANCE',
    extractMetadata: (_, args) => ({
      userId: args[0],
      type: args[1]?.type,
      amount: args[1]?.amount,
      currency: args[1]?.currency,
      reason: args[1]?.reason,
    }),
  })
  async adjustUserComp(
    @Param('userId') userId: string,
    @Body() dto: AdminCompAdjustRequestDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<AdminCompAdjustResponseDto> {
    const uid = BigInt(userId);
    const amount = new Prisma.Decimal(dto.amount);

    if (dto.type === AdminCompAdjustType.GIVE) {
      const wallet = await this.earnCompService.execute({
        userId: uid,
        currency: dto.currency,
        amount: amount,
        description: dto.reason || 'Admin Adjustment (GIVE)',
        options: {
          bypassPolicy: true,
          transactionType: CompTransactionType.ADMIN,
          processedBy: admin.id,
        },
      });
      return { newBalance: wallet.balance.toString() };
    } else {
      const wallet = await this.deductCompService.execute({
        userId: uid,
        currency: dto.currency,
        amount: amount,
        description: dto.reason || 'Admin Adjustment (DEDUCT)',
        options: {
          bypassPolicy: true,
          processedBy: admin.id,
        },
      });
      return { newBalance: wallet.balance.toString() };
    }
  }

  @Get('users/:userId/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get user comp transactions (Admin) / 사용자 콤프 거래 내역 조회 (관리자)',
    description:
      "Admin retrieves a specific user's comp transaction history / 관리자가 특정 사용자의 콤프 거래 내역을 조회합니다.",
  })
  @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
  @Paginated()
  @ApiPaginatedResponse(AdminCompTransactionResponseDto, {
    description:
      'Successfully retrieved user comp transactions / 사용자 콤프 거래 내역 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMP',
    action: 'USER_TRANSACTIONS_VIEW',
    extractMetadata: (_, args, result) => ({
      userId: args[0],
      total: result?.total,
    }),
  })
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query() query: AdminFindCompTransactionsQueryDto,
  ): Promise<PaginatedData<AdminCompTransactionResponseDto>> {
    const result = await this.findCompTransactionsService.execute({
      userId: BigInt(userId),
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return {
      data: result.data.map((item) => ({
        id: item.id.toString(),
        compWalletId: item.compWalletId.toString(),
        amount: item.amount.toString(),
        balanceBefore: item.balanceBefore.toString(),
        balanceAfter: item.balanceAfter.toString(),
        type: item.type,
        referenceId: item.referenceId ? item.referenceId.toString() : undefined,
        description: item.description ?? undefined,
        createdAt: item.createdAt,
      })),
      total: result.total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  @Get('configs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all comp configurations / 모든 콤프 설정 조회',
    description:
      'Retrieve all currency-specific comp configurations / 모든 통화별 콤프 설정을 조회합니다.',
  })
  @ApiStandardResponse(AdminCompConfigResponseDto, {
    description:
      'Successfully retrieved comp configurations / 콤프 설정 조회 성공',
    isArray: true,
  })
  async getAllConfigs(): Promise<AdminCompConfigResponseDto[]> {
    const configs = await this.findCompConfigService.findAll();
    return configs.map((c) => this.mapConfigToDto(c));
  }

  @Post('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update comp configuration / 콤프 설정 업데이트',
    description:
      'Update the global comp configuration for a specific currency / 특정 통화에 대한 전역 콤프 설정을 업데이트합니다.',
  })
  @ApiStandardResponse(AdminCompConfigResponseDto, {
    description:
      'Successfully updated comp configuration / 콤프 설정 업데이트 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMP',
    action: 'UPDATE_CONFIG',
    extractMetadata: (_, args) => ({
      currency: args[0]?.currency,
      updates: args[0],
    }),
  })
  async updateConfig(
    @Body() dto: AdminUpdateCompConfigDto,
  ): Promise<AdminCompConfigResponseDto> {
    const result = await this.updateCompConfigService.execute({
      ...dto,
      minClaimAmount: dto.minClaimAmount
        ? new Prisma.Decimal(dto.minClaimAmount)
        : undefined,
      maxDailyEarnPerUser: dto.maxDailyEarnPerUser
        ? new Prisma.Decimal(dto.maxDailyEarnPerUser)
        : undefined,
    });

    return this.mapConfigToDto(result);
  }

  private mapConfigToDto(c: CompConfig): AdminCompConfigResponseDto {
    return {
      id: c.id.toString(),
      currency: c.currency,
      isEarnEnabled: c.isEarnEnabled,
      isClaimEnabled: c.isClaimEnabled,
      allowNegativeBalance: c.allowNegativeBalance,
      minClaimAmount: c.minClaimAmount.toString(),
      maxDailyEarnPerUser: c.maxDailyEarnPerUser.toString(),
      expirationDays: c.expirationDays,
      description: c.description,
      updatedAt: c.updatedAt,
    };
  }
}
