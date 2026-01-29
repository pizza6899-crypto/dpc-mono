import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { Prisma } from '@prisma/client';
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
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@ApiTags('User Comp')
@Controller('user/comp')
@ApiStandardErrors()
export class CompUserController {
    constructor(
        private readonly claimCompService: ClaimCompService,
        private readonly findCompBalanceService: FindCompBalanceService,
        private readonly findCompTransactionsService: FindCompTransactionsService,
        private readonly sqidsService: SqidsService,
    ) { }

    @Get('balance')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user comp balance / 사용자 콤프 잔액 조회',
        description: 'Get current user\'s comp balance and accumulated statistics / 현재 로그인한 사용자의 콤프 잔액 및 누적 통계를 조회합니다.'
    })
    @ApiStandardResponse(CompBalanceResponseDto, {
        description: 'Successfully retrieved comp balance / 콤프 잔액 조회 성공'
    })
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
        };
    }

    @Post('claim')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Claim comp points as cash / 콤프 포인트 현금 전환',
        description: 'Convert accumulated comp points to actual cash balance / 누적된 콤프 포인트를 실제 현금 잔액으로 전환합니다.'
    })
    @ApiStandardResponse(ClaimCompResponseDto, {
        description: 'Successfully claimed comp points / 콤프 포인트 전환 성공'
    })
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
            claimedAmount: result.claimedAmount.toString(),
            newCompBalance: result.newCompBalance.toString(),
            newCashBalance: result.newCashBalance.toString(),
        };
    }

    @Get('transactions')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get my comp transactions / 내 콤프 거래 내역 조회',
        description: 'Retrieve the current user\'s comp transaction history (accrual, conversion, etc.) / 현재 로그인한 사용자의 콤프 거래 내역(적립, 전환 등)을 조회합니다.'
    })
    @Paginated()
    @ApiPaginatedResponse(CompTransactionResponseDto, {
        description: 'Successfully retrieved comp transactions / 콤프 거래 내역 조회 성공'
    })
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
            data: result.data.map(item => ({
                id: this.sqidsService.encode(item.id, SqidsPrefix.COM_TRANSACTION),
                compWalletId: this.sqidsService.encode(item.compWalletId, SqidsPrefix.COM_WALLET),
                amount: item.amount.toString(),
                balanceBefore: item.balanceBefore.toString(),
                balanceAfter: item.balanceAfter.toString(),
                type: item.type,
                createdAt: item.createdAt,
            })),
            total: result.total,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
    }
}
