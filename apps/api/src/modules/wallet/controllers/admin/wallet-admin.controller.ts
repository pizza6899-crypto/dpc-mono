// src/modules/wallet/controllers/admin/wallet-admin.controller.ts
import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/platform/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { GetUserBalanceAdminService } from '../../application/get-user-balance-admin.service';
import { AdminUserBalanceResponseDto } from './dto/response/admin-user-balance.response.dto';
import { GetUserBalanceQueryDto } from './dto/request/get-user-balance-query.dto';
import { WalletNotFoundException } from '../../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';

@Controller('admin/wallet')
@ApiTags('Admin Wallet (관리자 지갑 관리)')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class WalletAdminController {
  constructor(
    private readonly getUserBalanceAdminService: GetUserBalanceAdminService,
  ) {}

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
  async getUserBalance(
    @Param('userId') userId: string,
    @Query() query: GetUserBalanceQueryDto,
  ): Promise<AdminUserBalanceResponseDto> {
    try {
      const result = await this.getUserBalanceAdminService.execute({
        userId: BigInt(userId),
        currency: query.currency,
      });

      const walletArray = Array.isArray(result.wallet)
        ? result.wallet
        : [result.wallet];

      return {
        userId,
        wallets: walletArray.map((wallet) => ({
          currency: wallet.currency,
          mainBalance: wallet.mainBalance.toString(),
          bonusBalance: wallet.bonusBalance.toString(),
          totalBalance: wallet.totalBalance.toString(),
          updatedAt: wallet.updatedAt,
        })),
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new ApiException(
          MessageCode.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          error.message,
        );
      }
      if (error instanceof WalletNotFoundException) {
        throw new ApiException(
          MessageCode.USER_BALANCE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          error.message,
        );
      }
      throw error;
    }
  }
}

