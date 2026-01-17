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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { PaginatedResponseDto } from 'src/common/http/types/pagination.types';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { Prisma } from 'src/generated/prisma';
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
import { AffiliateCommission, CommissionNotFoundException, CommissionAccessDeniedException } from '../../domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

@ApiTags('Affiliate Commission')
@Controller('commissions')
@ApiStandardErrors()
export class AffiliateCommissionController {
  constructor(
    private readonly findCommissionsService: FindCommissionsService,
    private readonly findCommissionByIdService: FindCommissionByIdService,
    private readonly getWalletBalanceService: GetWalletBalanceService,
    private readonly getCommissionRateService: GetCommissionRateService,
    private readonly withdrawCommissionService: WithdrawCommissionService,
    private readonly sqidsService: SqidsService,
  ) { }

  /**
   * 커미션 목록 조회
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get commission list / 커미션 목록 조회',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMMISSION',
    action: 'COMMISSION_LIST_VIEW',
    extractMetadata: (_, args, result) => ({
      count: result?.data?.length ?? 0,
      total: result?.pagination?.total ?? 0,
      query: args[1], // query params
    }),
  })
  @ApiPaginatedResponse(CommissionResponseDto, {
    status: HttpStatus.OK,
    description:
      'Successfully retrieved commission list / 커미션 목록 조회 성공',
  })
  async getCommissions(
    @CurrentUser() user: CurrentUserWithSession,
    @Query() query: FindCommissionsQueryDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<PaginatedResponseDto<CommissionResponseDto>> {
    const {
      page = 1,
      limit = 20,
      status,
      currency,
      startDate,
      endDate,
    } = query;
    const offset = (page - 1) * limit;

    const { commissions, total } = await this.findCommissionsService.execute({
      affiliateId: user.id,
      options: {
        status,
        currency,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit,
        offset,
      },
      requestInfo,
    });

    return {
      data: commissions.map((commission) =>
        this.toCommissionResponse(commission),
      ),
      pagination: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 커미션 상세 조회 (ID)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get commission by ID / 커미션 ID로 조회',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMMISSION',
    action: 'COMMISSION_DETAIL_VIEW',
    extractMetadata: (_, args) => ({
      commissionId: args[1],
    }),
  })
  @ApiParam({ name: 'id', description: 'Commission ID (Encoded) / 커미션 ID' })
  @ApiStandardResponse(CommissionResponseDto, {
    status: 200,
    description: 'Successfully retrieved commission / 커미션 조회 성공',
  })
  async getCommissionById(
    @CurrentUser() user: CurrentUserWithSession,
    @Param('id') id: string,
  ): Promise<CommissionResponseDto> {
    const decodedId = this.sqidsService.decode(id, SqidsPrefix.COMMISSION);

    const commission = await this.findCommissionByIdService.execute({
      id: decodedId,
      affiliateId: user.id,
    });

    if (!commission) {
      throw new CommissionNotFoundException(decodedId);
    }

    // 본인 커미션만 조회 가능
    if (commission.affiliateId !== user.id) {
      throw new CommissionAccessDeniedException(decodedId);
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
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMMISSION',
    action: 'WALLET_BALANCE_VIEW',
    extractMetadata: (_, args, result) => ({
      currency: args[1],
    }),
  })
  @ApiStandardResponse(WalletBalanceResponseDto, {
    status: 200,
    description: 'Successfully retrieved wallet balance / 월렛 잔액 조회 성공',
  })
  async getWalletBalance(
    @CurrentUser() user: CurrentUserWithSession,
    @Query('currency') currency?: string,
    @RequestClientInfoParam() requestInfo?: RequestClientInfo,
  ): Promise<WalletBalanceResponseDto> {
    const wallets = await this.getWalletBalanceService.execute({
      affiliateId: user.id,
      currency: currency as any,
      requestInfo,
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
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMMISSION',
    action: 'COMMISSION_RATE_VIEW',
    extractMetadata: (_, args, result) => ({
      tier: result?.tier,
      effectiveRate: result?.effectiveRate,
    }),
  })
  @ApiStandardResponse(CommissionRateResponseDto, {
    status: 200,
    description:
      'Successfully retrieved commission rate / 커미션 요율 조회 성공',
  })
  async getCommissionRate(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<CommissionRateResponseDto> {
    const rate = await this.getCommissionRateService.execute({
      affiliateId: user.id,
    });

    return {
      tierCode: rate.tierCode,
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
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMMISSION',
    action: 'COMMISSION_WITHDRAWAL',
    extractMetadata: (_, args, result) => ({
      currency: args[1]?.currency,
      amount: args[1]?.amount,
    }),
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
      id: this.sqidsService.encode(commission.id!, SqidsPrefix.COMMISSION),
      affiliateId: this.sqidsService.encode(commission.affiliateId, SqidsPrefix.USER),
      subUserId: this.sqidsService.encode(commission.subUserId, SqidsPrefix.USER),
      gameRoundId: commission.gameRoundId
        ? commission.gameRoundId.toString()
        : '',
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
