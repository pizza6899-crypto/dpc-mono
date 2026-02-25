import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  Prisma,
  UserRoleType,
} from '@prisma/client';
import { FindCompTransactionsService } from '../../application/find-comp-transactions.service';
import { AdminFindCompTransactionsQueryDto } from './dto/request/admin-find-comp-transactions-query.dto';
import { AdminCompTransactionResponseDto } from './dto/response/admin-comp-transaction.response.dto';
import { FindCompAccountService } from '../../application/find-comp-account.service';
import type { CompConfig } from '../../domain';
import { FindCompConfigService } from '../../application/find-comp-config.service';
import { UpdateCompConfigService } from '../../application/update-comp-config.service';
import { UpdateCompAccountStatusService } from '../../application/update-comp-account-status.service';
import { AdminAdjustCompService } from '../../application/admin-adjust-comp.service';
import { AdminCompBalanceResponseDto } from './dto/response/admin-comp-balance.response.dto';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { AdminCompBalanceQueryDto } from './dto/request/admin-comp-balance-query.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { AdminCompConfigResponseDto } from './dto/response/admin-comp-config.response.dto';
import { AdminUpdateCompConfigDto } from './dto/request/admin-update-comp-config.dto';
import { AdminUpdateCompAccountStatusDto } from './dto/request/admin-update-comp-account-status.dto';
import { AdminAdjustCompDto } from './dto/request/admin-adjust-comp.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

@ApiTags('Admin Comp')
@Controller('admin/comp')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class CompAdminController {
  constructor(
    private readonly findCompAccountService: FindCompAccountService,
    private readonly findCompTransactionsService: FindCompTransactionsService,
    private readonly findCompConfigService: FindCompConfigService,
    private readonly updateCompConfigService: UpdateCompConfigService,
    private readonly updateCompAccountStatusService: UpdateCompAccountStatusService,
    private readonly adminAdjustCompService: AdminAdjustCompService,
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
    const account = await this.findCompAccountService.execute(
      BigInt(userId),
      query.currency,
    );
    return {
      currency: account.currency,
      balance: account.totalEarned.sub(account.totalUsed).toString(), // Derived balance
      isFrozen: account.isFrozen,
      totalEarned: account.totalEarned.toString(),
      totalUsed: account.totalUsed.toString(),
    };
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
        compAccountId: item.compAccountId.toString(),
        amount: item.amount.toString(),
        appliedRate: item.appliedRate ? item.appliedRate.toString() : undefined,
        type: item.type,
        referenceId: item.referenceId ? item.referenceId.toString() : undefined,
        parentTransactionId: item.parentTransactionId ? item.parentTransactionId.toString() : undefined,
        processedBy: item.processedBy ? item.processedBy.toString() : undefined,
        metadata: item.metadata,
        description: item.description ?? undefined,
        createdAt: item.createdAt,
      })),
      total: result.total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  @Patch('users/:userId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user comp account status (Admin) / 사용자 콤프 계정 상태 업데이트 (관리자)',
    description: 'Admin can freeze or unfreeze a specific user\'s comp account / 관리자가 특정 사용자의 콤프 계정을 동결 또는 활성화합니다.',
  })
  @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
  @ApiStandardResponse(AdminCompBalanceResponseDto, {
    description: 'Successfully updated user comp account status / 콤프 계정 상태 업데이트 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMP',
    action: 'USER_ACCOUNT_STATUS_UPDATE',
    extractMetadata: (_, args) => ({
      userId: args[0],
      currency: args[1]?.currency,
      isFrozen: args[1]?.isFrozen,
    }),
  })
  async updateUserAccountStatus(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateCompAccountStatusDto,
  ): Promise<AdminCompBalanceResponseDto> {
    const account = await this.updateCompAccountStatusService.execute({
      userId: BigInt(userId),
      currency: dto.currency,
      isFrozen: dto.isFrozen,
    });

    return {
      currency: account.currency,
      balance: account.totalEarned.sub(account.totalUsed).toString(),
      isFrozen: account.isFrozen,
      totalEarned: account.totalEarned.toString(),
      totalUsed: account.totalUsed.toString(),
    };
  }

  @Post('users/:userId/adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust user comp balance (Admin) / 사용자 콤프 잔액 수정 (관리자)',
    description: 'Admin can manually point up/down for a users comp account / 관리자가 수동으로 콤프 잔액을 차감하거나 지급합니다.',
  })
  @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
  @ApiStandardResponse(AdminCompBalanceResponseDto, {
    description: 'Successfully adjusted user comp balance / 콤프 잔액 수정 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMP',
    action: 'USER_BALANCE_ADJUST',
    extractMetadata: (user, args) => ({
      adminId: user.id,
      userId: args[1], // second param (first is user from @CurrentUser)
      currency: args[2]?.currency,
      amount: args[2]?.amount,
      description: args[2]?.description,
    }),
  })
  async adjustUserBalance(
    @CurrentUser() adminUser: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: AdminAdjustCompDto,
  ): Promise<AdminCompBalanceResponseDto> {
    const account = await this.adminAdjustCompService.execute({
      userId: BigInt(userId),
      adminId: BigInt(adminUser.id),
      currency: dto.currency,
      amount: new Prisma.Decimal(dto.amount),
      description: dto.description,
    });

    return {
      currency: account.currency,
      balance: account.totalEarned.sub(account.totalUsed).toString(),
      isFrozen: account.isFrozen,
      totalEarned: account.totalEarned.toString(),
      totalUsed: account.totalUsed.toString(),
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
      minSettlementAmount: dto.minSettlementAmount
        ? new Prisma.Decimal(dto.minSettlementAmount)
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
      isSettlementEnabled: c.isSettlementEnabled,
      minSettlementAmount: c.minSettlementAmount.toString(),
      maxDailyEarnPerUser: c.maxDailyEarnPerUser.toString(),
      description: c.description ?? undefined,
      updatedAt: c.updatedAt,
    };
  }
}
