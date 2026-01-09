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
import { ApiStandardErrors, ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import { AdminCompAdjustRequestDto, AdminCompAdjustType } from './dto/request/admin-comp-adjust.request.dto';
import { AdminCompBalanceQueryDto } from './dto/request/admin-comp-balance-query.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { PaginatedData } from 'src/common/http/types/pagination.types';

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
    @ApiOperation({ summary: 'Get user comp balance (Admin)' })
    @ApiParam({ name: 'userId', example: '1' })
    async getUserBalance(
        @Param('userId') userId: string,
        @Query() query: AdminCompBalanceQueryDto,
    ): Promise<CompBalanceResponseDto> {
        const wallet = await this.findCompBalanceService.execute(BigInt(userId), query.currency);
        return CompBalanceResponseDto.fromDomain(wallet);
    }

    @Post('users/:userId/adjust')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Adjust user comp balance (GIVE/DEDUCT)' })
    @ApiParam({ name: 'userId', example: '1' })
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'ADJUST_BALANCE',
    })
    async adjustUserComp(
        @Param('userId') userId: string,
        @Body() dto: AdminCompAdjustRequestDto,
    ): Promise<any> {
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
            return { success: true, newBalance: wallet.balance.toString() };
        } else {
            const wallet = await this.deductCompService.execute({
                userId: uid,
                currency: dto.currency,
                amount: amount,
                description: dto.reason || 'Admin Adjustment (DEDUCT)',
            });
            return { success: true, newBalance: wallet.balance.toString() };
        }
    }

    @Get('users/:userId/transactions')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get user comp transactions (Admin)' })
    @ApiParam({ name: 'userId', example: '1' })
    @Paginated()
    @ApiPaginatedResponse(CompTransactionResponseDto)
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
            ...result,
            data: result.data.map(CompTransactionResponseDto.fromDomain),
        };
    }
}
