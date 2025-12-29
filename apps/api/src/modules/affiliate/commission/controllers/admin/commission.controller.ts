// src/modules/affiliate/commission/controllers/admin/commission.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
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
import { RequireRoles } from 'src/platform/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import { Prisma } from '@repo/database';
import { FindCommissionByIdService } from '../../application/find-commission-by-id.service';
import { SetCustomRateService } from '../../application/set-custom-rate.service';
import { ResetCustomRateService } from '../../application/reset-custom-rate.service';
import { SetCustomRateDto } from './dto/request/set-custom-rate.dto';
import { ResetCustomRateDto } from './dto/request/reset-custom-rate.dto';
import { CommissionResponseDto } from './dto/response/commission.response.dto';
import { AffiliateTierResponseDto } from './dto/response/affiliate-tier.response.dto';
import { AffiliateCommission, AffiliateTier } from '../../domain';

@ApiTags('Admin Commission Management (관리자 커미션 관리)')
@Controller('admin/commissions')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AdminCommissionController {
  constructor(
    private readonly findCommissionByIdService: FindCommissionByIdService,
    private readonly setCustomRateService: SetCustomRateService,
    private readonly resetCustomRateService: ResetCustomRateService,
  ) {}

  /**
   * 커미션 상세 조회 (ID - 관리자용)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get commission by ID / 커미션 ID로 조회 (관리자용)',
  })
  @ApiStandardResponse(CommissionResponseDto, {
    status: 200,
    description: 'Successfully retrieved commission / 커미션 조회 성공',
  })
  async getCommissionById(
    @Param('id') id: string,
  ): Promise<CommissionResponseDto> {
    const commission = await this.findCommissionByIdService.execute({
      id: BigInt(id),
    });

    if (!commission) {
      throw new Error('Commission not found');
    }

    return this.toCommissionResponse(commission);
  }

  /**
   * 수동 요율 설정
   */
  @Post('rate/set')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set custom commission rate / 수동 커미션 요율 설정',
  })
  @ApiStandardResponse(AffiliateTierResponseDto, {
    status: 200,
    description: 'Successfully set custom rate / 수동 요율 설정 성공',
  })
  async setCustomRate(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: SetCustomRateDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AffiliateTierResponseDto> {
    const tier = await this.setCustomRateService.execute({
      affiliateId: dto.affiliateId,
      customRate: new Prisma.Decimal(dto.customRate),
      setBy: user.id,
      requestInfo,
    });

    return this.toTierResponse(tier);
  }

  /**
   * 수동 요율 해제
   */
  @Post('rate/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset custom commission rate / 수동 커미션 요율 해제',
  })
  @ApiStandardResponse(AffiliateTierResponseDto, {
    status: 200,
    description: 'Successfully reset custom rate / 수동 요율 해제 성공',
  })
  async resetCustomRate(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: ResetCustomRateDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<AffiliateTierResponseDto> {
    const tier = await this.resetCustomRateService.execute({
      affiliateId: dto.affiliateId,
      resetBy: user.id,
      requestInfo,
    });

    return this.toTierResponse(tier);
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

  /**
   * 도메인 엔티티를 Tier Response DTO로 변환
   */
  private toTierResponse(tier: AffiliateTier): AffiliateTierResponseDto {
    return {
      uid: tier.uid,
      affiliateId: tier.affiliateId,
      tier: tier.tier,
      baseRate: tier.baseRate.toString(),
      customRate: tier.customRate?.toString() || null,
      isCustomRate: tier.isCustomRate,
      monthlyWagerAmount: tier.monthlyWagerAmount.toString(),
      customRateSetBy: tier.customRateSetBy,
      customRateSetAt: tier.customRateSetAt,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    };
  }
}
