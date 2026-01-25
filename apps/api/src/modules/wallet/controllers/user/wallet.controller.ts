import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { FindUserWalletService } from '../../application/find-user-wallet.service';
import { FindWalletTransactionHistoryService } from '../../application/find-wallet-transaction-history.service';
import { UserWalletListResponseDto } from './dto/response/user-wallet.response.dto';
import { GetBalanceQueryDto } from './dto/request/get-balance-query.dto';
import { UserWallet, WalletNotFoundException } from '../../domain';
import { UserWalletTransactionResponseDto } from './dto/response/wallet-transaction.response.dto';
import { GetUserWalletTransactionHistoryQueryDto } from './dto/request/get-wallet-transaction-history-query.dto';
import { ExchangeCurrencyCode } from '@prisma/client';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import { CurrencyListResponseDto } from './dto/response/currency-list.response.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Controller('wallet')
@ApiTags('Wallet')
@ApiStandardErrors()
export class WalletController {
  constructor(
    private readonly findUserWalletService: FindUserWalletService,
    private readonly findWalletTransactionHistoryService: FindWalletTransactionHistoryService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * 지원하는 통화 목록 조회
   */
  @Get('currencies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get supported currencies / 지원하는 통화 목록 조회',
    description: '시스템에서 지원하는 월렛 통화 목록을 조회합니다.',
  })
  @ApiStandardResponse(CurrencyListResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved supported currencies / 지원하는 통화 목록 조회 성공',
  })
  getCurrencies(): CurrencyListResponseDto {
    return {
      currencies: WALLET_CURRENCIES as ExchangeCurrencyCode[],
    };
  }

  /**
   * 사용자 잔액 조회
   */
  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user balance / 사용자 잔액 조회',
    description: '사용자가 본인의 잔액을 조회합니다. 통화를 지정하지 않으면 모든 통화의 잔액을 반환합니다.',
  })
  @ApiStandardResponse(UserWalletListResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved user balance / 사용자 잔액 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'WALLET',
    action: 'VIEW_BALANCE',
    extractMetadata: (req, args) => ({
      currency: args[1]?.currency,
    }),
  })
  async getBalance(
    @CurrentUser() user: CurrentUserWithSession,
    @Query() query: GetBalanceQueryDto,
  ): Promise<UserWalletListResponseDto> {
    const userId = BigInt(user.id);
    let wallets: UserWallet[] = [];

    if (query.currency) {
      const wallet = await this.findUserWalletService.findWallet(userId, query.currency);
      if (!wallet) {
        throw new WalletNotFoundException(userId, query.currency);
      }
      wallets.push(wallet);
    } else {
      wallets = await this.findUserWalletService.findWallets(userId);
    }

    return {
      wallets: wallets.map((wallet) => ({
        currency: wallet.currency,
        cashBalance: wallet.cash.toString(),
        bonusBalance: wallet.bonus.toString(),

        lockedBalance: wallet.lock.toString(),
        vaultBalance: wallet.vault.toString(),
        totalBalance: wallet.totalAvailableBalance.toString(),
        status: wallet.status,
      })),
    };
  }

  /**
   * 사용자 트랜잭션 이력 조회
   */
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get transaction history / 트랜잭션 이력 조회',
    description: '사용자가 본인의 지갑 트랜잭션 이력을 조회합니다.',
  })
  @ApiPaginatedResponse(UserWalletTransactionResponseDto, {
    status: HttpStatus.OK,
    description: 'Successfully retrieved transaction history / 트랜잭션 이력 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'WALLET',
    action: 'VIEW_TRANSACTIONS',
    extractMetadata: (req, args) => ({
      ...args[1],
    }),
  })
  async getTransactionHistory(
    @CurrentUser() user: CurrentUserWithSession,
    @Query() query: GetUserWalletTransactionHistoryQueryDto,
  ): Promise<PaginatedData<UserWalletTransactionResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, total } = await this.findWalletTransactionHistoryService.execute({
      userId: BigInt(user.id),
      currency: query.currency,
      type: query.type,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page,
      limit,
    });

    return {
      data: items.map((tx) => {
        return {
          id: tx.id ? this.sqidsService.encode(tx.id, SqidsPrefix.WALLET_TRANSACTION) : '',
          type: tx.type,
          balanceType: tx.balanceType,
          currency: tx.currency,
          amount: tx.amount.toString(),
          balanceAfter: tx.balanceAfter.toString(),
          createdAt: tx.createdAt,
        };
      }),
      total,
      page,
      limit,
    };
  }
}

