// src/modules/affiliate/commission/controllers/user/commission.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/platform/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { Prisma } from '@repo/database';
import { FindCommissionsService } from '../../application/find-commissions.service';
import { FindCommissionByIdService } from '../../application/find-commission-by-id.service';
import { GetWalletBalanceService } from '../../application/get-wallet-balance.service';
import { GetCommissionRateService } from '../../application/get-commission-rate.service';
import { WithdrawCommissionService } from '../../application/withdraw-commission.service';
import { FindCommissionsQueryDto } from './dto/request/find-commissions-query.dto';
import { WithdrawCommissionDto } from './dto/request/withdraw-commission.dto';
import { CommissionResponseDto } from './dto/response/commission.response.dto';
import { WalletBalanceResponseDto } from './dto/response/wallet-balance.response.dto';
import { CommissionRateResponseDto } from './dto/response/commission-rate.response.dto';
import { WithdrawCommissionResponseDto } from './dto/response/withdraw-commission.response.dto';
import { AffiliateCommission } from '../../domain';

@ApiTags('Affiliate Commission (어필리에이트 커미션)')
@Controller('commissions')
@ApiStandardErrors()
export class AffiliateCommissionController {
  constructor(
    private readonly findCommissionsService: FindCommissionsService,
    private readonly findCommissionByIdService: FindCommissionByIdService,
    private readonly getWalletBalanceService: GetWalletBalanceService,
    private readonly getCommissionRateService: GetCommissionRateService,
    private readonly withdrawCommissionService: WithdrawCommissionService,
  ) {}

  /**
   * 커미션 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get commission list / 커미션 목록 조회',
  })
  @ApiStandardResponse(CommissionResponseDto, {
    status: 200,
    description:
      'Successfully retrieved commission list / 커미션 목록 조회 성공',
    isArray: true,
  })
  async getCommissions(
    @CurrentUser() user: CurrentUserWithSession,
    @Query() query: FindCommissionsQueryDto,
  ): Promise<CommissionResponseDto[]> {
    const {
      page = 1,
      limit = 20,
      status,
      currency,
      startDate,
      endDate,
    } = query;
    const offset = (page - 1) * limit;

    const commissions = await this.findCommissionsService.execute({
      affiliateId: user.id,
      options: {
        status,
        currency,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit,
        offset,
      },
    });

    return commissions.map((commission) =>
      this.toCommissionResponse(commission),
    );
  }

  /**
   * 커미션 상세 조회 (UID)
   */
  @Get(':uid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get commission by UID / 커미션 UID로 조회',
  })
  @ApiStandardResponse(CommissionResponseDto, {
    status: 200,
    description: 'Successfully retrieved commission / 커미션 조회 성공',
  })
  async getCommissionByUid(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('uid') uid: string,
  ): Promise<CommissionResponseDto> {
    const commission = await this.findCommissionByIdService.execute({
      uid,
    });

    if (!commission) {
      throw new Error('Commission not found');
    }

    // 본인 커미션만 조회 가능
    if (commission.affiliateId !== user.id) {
      throw new Error('Unauthorized');
    }

    return this.toCommissionResponse(commission);
  }

  /**
   * 월렛 잔액 조회
   */
  @Get('wallet/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get wallet balance / 월렛 잔액 조회',
  })
  @ApiStandardResponse(WalletBalanceResponseDto, {
    status: 200,
    description: 'Successfully retrieved wallet balance / 월렛 잔액 조회 성공',
  })
  async getWalletBalance(
    @CurrentUser() user: CurrentUserWithSession,
    @Query('currency') currency?: string,
  ): Promise<WalletBalanceResponseDto> {
    const wallets = await this.getWalletBalanceService.execute({
      affiliateId: user.id,
      currency: currency as any,
    });

    const walletArray = Array.isArray(wallets) ? wallets : [wallets];

    return {
      wallets: walletArray.map((wallet) => ({
        currency: wallet.currency,
        availableBalance: wallet.availableBalance.toString(),
        pendingBalance: wallet.pendingBalance.toString(),
        totalEarned: wallet.totalEarned.toString(),
      })),
    };
  }

  /**
   * 커미션 요율 조회
   */
  @Get('rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get commission rate / 커미션 요율 조회',
  })
  @ApiStandardResponse(CommissionRateResponseDto, {
    status: 200,
    description:
      'Successfully retrieved commission rate / 커미션 요율 조회 성공',
  })
  async getCommissionRate(
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<CommissionRateResponseDto> {
    const rate = await this.getCommissionRateService.execute({
      affiliateId: user.id,
    });

    return {
      tier: rate.tier,
      baseRate: rate.baseRate.toString(),
      customRate: rate.customRate?.toString() || null,
      isCustomRate: rate.isCustomRate,
      effectiveRate: rate.effectiveRate.toString(),
    };
  }

  /**
   * 커미션 출금
   */
  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw commission / 커미션 출금',
  })
  @ApiStandardResponse(WithdrawCommissionResponseDto, {
    status: 200,
    description: 'Successfully withdrawn commission / 커미션 출금 성공',
  })
  async withdrawCommission(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: WithdrawCommissionDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<WithdrawCommissionResponseDto> {
    const wallet = await this.withdrawCommissionService.execute({
      affiliateId: user.id,
      currency: dto.currency,
      amount: new Prisma.Decimal(dto.amount),
      requestInfo,
    });

    return {
      currency: wallet.currency,
      availableBalance: wallet.availableBalance.toString(),
      pendingBalance: wallet.pendingBalance.toString(),
      totalEarned: wallet.totalEarned.toString(),
    };
  }

  /**
   * 도메인 엔티티를 Response DTO로 변환
   */
  private toCommissionResponse(
    commission: AffiliateCommission,
  ): CommissionResponseDto {
    return {
      uid: commission.uid,
      affiliateId: commission.affiliateId,
      subUserId: commission.subUserId,
      gameRoundId: commission.gameRoundId,
      wagerAmount: commission.wagerAmount.toString(),
      winAmount: commission.winAmount?.toString() || null,
      commission: commission.commission.toString(),
      rateApplied: commission.rateApplied.toString(),
      currency: commission.currency,
      status: commission.status,
      gameCategory: commission.gameCategory,
      settlementDate: commission.settlementDate,
      claimedAt: commission.claimedAt,
      withdrawnAt: commission.withdrawnAt,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt,
    };
  }
}
