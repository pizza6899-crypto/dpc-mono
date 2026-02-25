import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { FindCompAccountService } from '../../application/find-comp-account.service';
import { CompBalanceQueryDto } from './dto/request/comp-balance-query.dto';
import { CompBalanceResponseDto } from './dto/response/comp-balance.response.dto';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { FindCompTransactionsService } from '../../application/find-comp-transactions.service';
import { UserFindCompTransactionsQueryDto } from './dto/request/user-find-comp-transactions-query.dto';
import { UserCompTransactionResponseDto } from './dto/response/user-comp-transaction.response.dto';
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
    private readonly findCompAccountService: FindCompAccountService,
    private readonly findCompTransactionsService: FindCompTransactionsService,
    private readonly sqidsService: SqidsService,
  ) { }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user comp balance / 사용자 콤프 잔액 조회',
    description:
      "Get current user's comp balance and accumulated statistics / 현재 로그인한 사용자의 콤프 잔액 및 누적 통계를 조회합니다.",
  })
  @ApiStandardResponse(CompBalanceResponseDto, {
    description: 'Successfully retrieved comp balance / 콤프 잔액 조회 성공',
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
    const account = await this.findCompAccountService.execute(
      userId,
      query.currency,
    );
    return {
      currency: account.currency,
      balance: account.totalEarned.sub(account.totalUsed).toString(),
      totalEarned: account.totalEarned.toString(),
      totalUsed: account.totalUsed.toString(),
    };
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my comp transactions / 내 콤프 거래 내역 조회',
    description:
      "Retrieve the current user's comp transaction history (accrual, conversion, etc.) / 현재 로그인한 사용자의 콤프 거래 내역(적립, 전환 등)을 조회합니다.",
  })
  @Paginated()
  @ApiPaginatedResponse(UserCompTransactionResponseDto, {
    description:
      'Successfully retrieved comp transactions / 콤프 거래 내역 조회 성공',
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
    @Query() query: UserFindCompTransactionsQueryDto,
  ): Promise<PaginatedData<UserCompTransactionResponseDto>> {
    const result = await this.findCompTransactionsService.execute({
      userId: BigInt(user.id),
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return {
      data: result.data.map((item) => ({
        id: this.sqidsService.encode(item.id, SqidsPrefix.COM_TRANSACTION),
        compAccountId: this.sqidsService.encode(
          item.compAccountId,
          SqidsPrefix.COM_WALLET, // Kept the generic string "CW" in SqiDs constants if there is no separate CA prefix
        ),
        amount: item.amount.toString(),
        type: item.type,
        description: item.description,
        createdAt: item.createdAt,
      })),
      total: result.total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }
}

