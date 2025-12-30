// src/modules/wallet/controllers/admin/wallet-admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { GetUserBalanceAdminService } from '../../application/get-user-balance-admin.service';
import { UpdateUserBalanceAdminService } from '../../application/update-user-balance-admin.service';
import { AdminUserBalanceResponseDto } from './dto/response/admin-user-balance.response.dto';
import { UpdateUserBalanceResponseDto } from './dto/response/update-user-balance.response.dto';
import { GetUserBalanceQueryDto } from './dto/request/get-user-balance-query.dto';
import { UpdateUserBalanceRequestDto } from './dto/request/update-user-balance.request.dto';
import {
  WalletNotFoundException,
  InsufficientBalanceException,
  InvalidWalletBalanceException,
} from '../../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types/message-codes';
import { Prisma } from '@repo/database';

@Controller('admin/wallet')
@ApiTags('Admin Wallet (관리자 지갑 관리)')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class WalletAdminController {
  constructor(
    private readonly getUserBalanceAdminService: GetUserBalanceAdminService,
    private readonly updateUserBalanceAdminService: UpdateUserBalanceAdminService,
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

  /**
   * 사용자 잔액 업데이트 (관리자용)
   */
  @Patch('users/:userId/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user balance / 사용자 잔액 업데이트 (관리자용)',
    description:
      '관리자가 특정 사용자의 잔액을 증가 또는 감소시킵니다. 메인 잔액, 보너스 잔액, 또는 총 잔액에 대해 추가 또는 차감 연산을 수행할 수 있습니다.',
  })
  @ApiParam({
    name: 'userId',
    description: '사용자 ID',
    type: String,
    example: '1234567890123456789',
  })
  @ApiStandardResponse(UpdateUserBalanceResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully updated user balance / 사용자 잔액 업데이트 성공',
  })
  async updateUserBalance(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserBalanceRequestDto,
  ): Promise<UpdateUserBalanceResponseDto> {
    try {
      const result = await this.updateUserBalanceAdminService.execute({
        userId: BigInt(userId),
        currency: updateDto.currency,
        balanceType: updateDto.balanceType,
        operation: updateDto.operation,
        amount: new Prisma.Decimal(updateDto.amount),
      });

      return {
        userId,
        currency: result.wallet.currency,
        beforeMainBalance: result.beforeMainBalance.toString(),
        afterMainBalance: result.afterMainBalance.toString(),
        beforeBonusBalance: result.beforeBonusBalance.toString(),
        afterBonusBalance: result.afterBonusBalance.toString(),
        mainBalanceChange: result.mainBalanceChange.toString(),
        bonusBalanceChange: result.bonusBalanceChange.toString(),
        totalBalance: result.wallet.totalBalance.toString(),
        updatedAt: result.wallet.updatedAt,
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new ApiException(
          MessageCode.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          error.message,
        );
      }
      if (error instanceof InsufficientBalanceException) {
        throw new ApiException(
          MessageCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          error.message,
        );
      }
      if (error instanceof InvalidWalletBalanceException) {
        throw new ApiException(
          MessageCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          error.message,
        );
      }
      throw error;
    }
  }
}

