import { Body, Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { ClaimCompService } from '../../application/claim-comp.service';
import { FindCompBalanceService } from '../../application/find-comp-balance.service';
import { ClaimCompRequestDto } from './dto/request/claim-comp.request.dto';
import { CompBalanceQueryDto } from './dto/request/comp-balance-query.dto';
import { CompBalanceResponseDto } from './dto/response/comp-balance.response.dto';
import { ClaimCompResponseDto } from './dto/response/claim-comp.response.dto';
import { ApiStandardResponse, ApiStandardErrors, ApiPaginatedResponse } from 'src/common/http/decorators/api-response.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { FindCompTransactionsService } from '../../application/find-comp-transactions.service';
import { FindCompTransactionsQueryDto } from '../dto/request/find-comp-transactions-query.dto';
import { CompTransactionResponseDto } from '../dto/response/comp-transaction.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('Comp')
@Controller('user/comp')
@ApiStandardErrors()
export class CompUserController {
    constructor(
        private readonly claimCompService: ClaimCompService,
        private readonly findCompBalanceService: FindCompBalanceService,
        private readonly findCompTransactionsService: FindCompTransactionsService,
    ) { }

    @Get('balance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get user comp balance' })
    @ApiStandardResponse(CompBalanceResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'BALANCE_VIEW',
        extractMetadata: (user, args) => ({
            userId: user.id,
            currency: args[0]?.currency,
        }),
    })
    async getBalance(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: CompBalanceQueryDto,
    ): Promise<CompBalanceResponseDto> {
        const userId = BigInt(user.id);
        const wallet = await this.findCompBalanceService.execute(userId, query.currency);
        return {
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            totalEarned: wallet.totalEarned.toString(),
            totalUsed: wallet.totalUsed.toString(),
        };
    }

    @Post('claim')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Claim comp points as cash' })
    @ApiStandardResponse(ClaimCompResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'CLAIM',
        extractMetadata: (user, args, result) => ({
            userId: user.id,
            currency: args[0]?.currency,
            amount: args[0]?.amount,
            claimedAmount: result?.claimedAmount,
        }),
    })
    async claim(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: ClaimCompRequestDto,
    ): Promise<ClaimCompResponseDto> {
        const userId = BigInt(user.id);
        const result = await this.claimCompService.execute({
            userId,
            currency: dto.currency,
            amount: new Prisma.Decimal(dto.amount),
        });

        return {
            success: true,
            claimedAmount: result.claimedAmount.toString(),
            newCompBalance: result.newCompBalance.toString(),
            newCashBalance: result.newCashBalance.toString(),
        };
    }

    @Get('transactions')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get my comp transactions' })
    @Paginated()
    @ApiPaginatedResponse(CompTransactionResponseDto)
    @AuditLog({
        type: LogType.ACTIVITY,
        category: 'COMP',
        action: 'TRANSACTIONS_VIEW',
        extractMetadata: (user, _, result) => ({
            userId: user.id,
            total: result?.total,
        }),
    })
    async getTransactions(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: FindCompTransactionsQueryDto,
    ): Promise<PaginatedData<CompTransactionResponseDto>> {
        const result = await this.findCompTransactionsService.execute({
            userId: BigInt(user.id),
            ...query,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        });

        return {
            ...result,
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
        };
    }
}
