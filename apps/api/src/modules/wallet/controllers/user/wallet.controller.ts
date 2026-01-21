// src/modules/wallet/controllers/user/wallet.controller.ts
import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { GetUserBalanceService } from '../../application/get-user-balance.service';
import { UserBalanceResponseDto } from './dto/response/user-balance.response.dto';
import { GetBalanceQueryDto } from './dto/request/get-balance-query.dto';

@Controller('wallet')
@ApiTags('Wallet')
@ApiStandardErrors()
export class WalletController {
  constructor(
    private readonly getUserBalanceService: GetUserBalanceService,
  ) { }

  /**
   * 사용자 잔액 조회
   */
  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user balance / 사용자 잔액 조회',
    description: '사용자가 본인의 잔액을 조회합니다. 통화를 지정하지 않으면 모든 통화의 잔액을 반환합니다.',
  })
  @ApiStandardResponse(UserBalanceResponseDto, {
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
  ): Promise<UserBalanceResponseDto> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const result = await this.getUserBalanceService.execute({
      userId: user.id,
      currency: query.currency,
    });

    const walletArray = Array.isArray(result.wallet)
      ? result.wallet
      : [result.wallet];

    return {
      wallets: walletArray.map((wallet) => ({
        currency: wallet.currency,
        mainBalance: wallet.cash.toString(),
        bonusBalance: wallet.bonus.toString(),
        totalBalance: wallet.totalAvailableBalance.toString(),
      })),
    };
  }
}

