// src/modules/affiliate/commission/controllers/admin/commission.controller.ts
import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@prisma/client';
import { FindCommissionByIdService } from '../../application/find-commission-by-id.service';
import { CommissionAdminResponseDto } from './dto/response/commission-admin.response.dto';
import { CommissionRateAdminResponseDto } from './dto/response/commission-rate-admin.response.dto';
import { AffiliateCommission, CommissionNotFoundException } from '../../domain';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('Admin Commission Management')
@Controller('admin/commissions')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class AdminCommissionController {
  constructor(
    private readonly findCommissionByIdService: FindCommissionByIdService,
  ) {}

  /**
   * 커미션 상세 조회 (ID - 관리자용)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get commission by ID / 커미션 ID로 조회 (관리자용)',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'COMMISSION',
    action: 'COMMISSION_DETAIL_VIEW',
    extractMetadata: (_, args, result) => ({
      commissionId: args[0],
      affiliateId: result?.affiliateId?.toString(),
    }),
  })
  @ApiParam({ name: 'id', description: 'Commission ID / 커미션 ID' })
  @ApiStandardResponse(CommissionAdminResponseDto, {
    status: 200,
    description: 'Successfully retrieved commission / 커미션 조회 성공',
  })
  async getCommissionById(
    @Param('id') id: string,
  ): Promise<CommissionAdminResponseDto> {
    const commission = await this.findCommissionByIdService.execute({
      id: BigInt(id),
    });

    if (!commission) {
      throw new CommissionNotFoundException(BigInt(id));
    }

    return this.toCommissionResponse(commission);
  }

  /**
   * 도메인 엔티티를 Response DTO로 변환
   */
  private toCommissionResponse(
    commission: AffiliateCommission,
  ): CommissionAdminResponseDto {
    return {
      id: commission.id!.toString(),
      affiliateId: commission.affiliateId,
      subUserId: commission.subUserId,
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

  /**
   * Rate 결과를 Response DTO로 변환
   */
  private toRateResponse(result: {
    tierCode: string;
    baseRate: any;
    customRate: any;
    isCustomRate: boolean;
    effectiveRate: any;
  }): CommissionRateAdminResponseDto {
    return {
      tierCode: result.tierCode,
      baseRate: result.baseRate.toString(),
      customRate: result.customRate?.toString() || null,
      isCustomRate: result.isCustomRate,
      effectiveRate: result.effectiveRate.toString(),
    };
  }
}
