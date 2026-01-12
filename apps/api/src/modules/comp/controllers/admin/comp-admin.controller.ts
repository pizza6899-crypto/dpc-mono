import { Body, Controller, Get, Param, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Prisma, UserRoleType } from '@repo/database';
import { FindCompTransactionsService } from '../../application/find-comp-transactions.service';
import { FindCompTransactionsQueryDto } from '../dto/request/find-comp-transactions-query.dto';
import { CompTransactionResponseDto } from '../dto/response/comp-transaction.response.dto';
import { FindCompBalanceService } from '../../application/find-comp-balance.service';
import { EarnCompService } from '../../application/earn-comp.service';
import { DeductCompService } from '../../application/deduct-comp.service';
import { CompBalanceResponseDto } from '../user/dto/response/comp-balance.response.dto';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { ApiStandardErrors, ApiPaginatedResponse, ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { AdminCompAdjustRequestDto, AdminCompAdjustType } from './dto/request/admin-comp-adjust.request.dto';
import { AdminCompBalanceQueryDto } from './dto/request/admin-comp-balance-query.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { AdminCompAdjustResponseDto } from './dto/response/admin-comp-adjust.response.dto';


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
    ) { }

    @Get('users/:userId/balance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user comp balance (Admin)',
        description: '관리자가 특정 사용자의 콤프 잔액 및 통계를 조회합니다.'
    })
    @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
    @ApiStandardResponse(CompBalanceResponseDto, {
        description: 'Successfully retrieved user comp balance'
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
    ): Promise<CompBalanceResponseDto> {
        const wallet = await this.findCompBalanceService.execute(BigInt(userId), query.currency);
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
        summary: 'Adjust user comp balance (GIVE/DEDUCT)',
        description: '관리자가 특정 사용자의 콤프 잔액을 수동으로 지급하거나 차감합니다.'
    })
    @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
    @ApiStandardResponse(AdminCompAdjustResponseDto, {
        description: 'Successfully adjusted user comp balance'
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
    ): Promise<AdminCompAdjustResponseDto> {
        const uid = BigInt(userId);
        const amount = new Prisma.Decimal(dto.amount);

        if (dto.type === AdminCompAdjustType.GIVE) {
            const wallet = await this.earnCompService.execute({
                userId: uid,
                currency: dto.currency,
                amount: amount,
                description: dto.reason || 'Admin Adjustment (GIVE)',
                referenceId: `ADMIN-GIVE-${Date.now()}`
            });
            return { newBalance: wallet.balance.toString() };
        } else {
            const wallet = await this.deductCompService.execute({
                userId: uid,
                currency: dto.currency,
                amount: amount,
                description: dto.reason || 'Admin Adjustment (DEDUCT)',
            });
            return { newBalance: wallet.balance.toString() };
        }
    }

    @Get('users/:userId/transactions')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user comp transactions (Admin)',
        description: '관리자가 특정 사용자의 콤프 거래 내역을 조회합니다.'
    })
    @ApiParam({ name: 'userId', example: '1', description: 'User ID' })
    @Paginated()
    @ApiPaginatedResponse(CompTransactionResponseDto, {
        description: 'Successfully retrieved user comp transactions'
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
        @Query() query: FindCompTransactionsQueryDto,
    ): Promise<PaginatedData<CompTransactionResponseDto>> {
        const result = await this.findCompTransactionsService.execute({
            userId: BigInt(userId),
            ...query,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        });

        return {
            data: result.data.map(item => ({
                id: item.id.toString(),
                compWalletId: item.compWalletId.toString(),
                amount: item.amount.toString(),
                balanceAfter: item.balanceAfter.toString(),
                type: item.type,
                referenceId: item.referenceId ?? undefined,
                description: item.description ?? undefined,
                createdAt: item.createdAt,
            })),
            total: result.total,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
    }
}
