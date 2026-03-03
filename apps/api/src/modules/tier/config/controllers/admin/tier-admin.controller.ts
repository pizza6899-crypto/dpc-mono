import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRoleType } from '@prisma/client';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from 'src/common/http/decorators/api-response.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { TierService } from '../../application/tier.service';
import { Tier } from '../../domain/tier.entity';
import { TierAdminResponseDto } from './dto/response/tier-admin.response.dto';
import { UpdateTierAdminRequestDto } from './dto/request/update-tier-admin.request.dto';

@Controller('admin/tiers')
@ApiTags('Admin Tiers')
@ApiStandardErrors()
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
export class TierAdminController {
  constructor(private readonly tierService: TierService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all tiers / 전체 티어 목록 조회',
    description:
      'Retrieves all tier information and benefits configured in the system. / 시스템에 설정된 모든 티어 정보와 혜택 목록을 조회합니다.',
  })
  @ApiStandardResponse(TierAdminResponseDto, { isArray: true })
  async getTiers(): Promise<TierAdminResponseDto[]> {
    const tiers = await this.tierService.findAll();
    return tiers.map((tier) => this.mapToResponseDto(tier));
  }

  @Put(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update tier / 티어 정보 수정',
    description:
      'Updates tier promotion requirements, benefits, and localized names. / 티어의 승급 조건, 혜택, 다국어 명칭 등을 수정합니다.',
  })
  @ApiStandardResponse(TierAdminResponseDto)
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'UPDATE_TIER',
    category: 'TIER',
    extractMetadata: (req) => ({
      tierCode: req.params.code,
      before: req.__audit_before,
      after: req.__audit_after,
    }),
  })
  async updateTier(
    @Param('code') code: string,
    @Body() dto: UpdateTierAdminRequestDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ): Promise<TierAdminResponseDto> {
    // Audit log용 이전 상태 기록
    const before = await this.tierService.findByCode(code);

    const updated = await this.tierService.update({
      code,
      ...dto,
      updatedBy: admin.id,
    });

    // Audit log 메타데이터 세팅
    req.__audit_before = this.mapToAuditData(before);
    req.__audit_after = this.mapToAuditData(updated);

    return this.mapToResponseDto(updated);
  }

  private mapToResponseDto(tier: Tier): TierAdminResponseDto {
    return {
      level: tier.level,
      code: tier.code,
      upgradeExpRequired: tier.upgradeExpRequired.toString(),
      evaluationCycle: tier.evaluationCycle,
      upgradeBonusWageringMultiplier:
        tier.upgradeBonusWageringMultiplier.toString(),
      rewardExpiryDays: tier.rewardExpiryDays,
      compRate: tier.compRate.toString(),
      weeklyLossbackRate: tier.weeklyLossbackRate.toString(),
      monthlyLossbackRate: tier.monthlyLossbackRate.toString(),
      dailyWithdrawalLimitUsd: tier.dailyWithdrawalLimitUsd.toString(),
      weeklyWithdrawalLimitUsd: tier.weeklyWithdrawalLimitUsd.toString(),
      monthlyWithdrawalLimitUsd: tier.monthlyWithdrawalLimitUsd.toString(),
      isWithdrawalUnlimited: tier.isWithdrawalUnlimited,
      hasDedicatedManager: tier.hasDedicatedManager,
      isActive: tier.isActive,
      isHidden: tier.isHidden,
      isManualOnly: tier.isManualOnly,
      imageUrl: tier.imageUrl,
      translations: tier.translations.map((t) => ({
        language: t.language,
        name: t.name,
        description: t.description,
      })),
      benefits: tier.benefits.map((b) => ({
        currency: b.currency,
        upgradeBonus: b.upgradeBonus.toString(),
        birthdayBonus: b.birthdayBonus.toString(),
      })),
      updatedAt: tier.updatedAt,
      updatedBy: tier.updatedBy?.toString() ?? null,
    };
  }

  private mapToAuditData(tier: Tier) {
    return {
      level: tier.level,
      code: tier.code,
      requirements: {
        upgradeExp: tier.upgradeExpRequired.toString(),
      },
      benefits: {
        comp: tier.compRate.toString(),
        weeklyLossback: tier.weeklyLossbackRate.toString(),
        monthlyLossback: tier.monthlyLossbackRate.toString(),
        upgrade: {
          wager: tier.upgradeBonusWageringMultiplier.toString(),
        },
        rewardExpiryDays: tier.rewardExpiryDays,
        currencyBenefits: tier.benefits.map((b) => ({
          currency: b.currency,
          upgradeBonus: b.upgradeBonus.toString(),
          birthdayBonus: b.birthdayBonus.toString(),
        })),
      },
      limits: {
        dailyWithdrawal: tier.dailyWithdrawalLimitUsd.toString(),
        weeklyWithdrawal: tier.weeklyWithdrawalLimitUsd.toString(),
        monthlyWithdrawal: tier.monthlyWithdrawalLimitUsd.toString(),
        isUnlimited: tier.isWithdrawalUnlimited,
      },
      control: {
        isActive: tier.isActive,
        isHidden: tier.isHidden,
        isManualOnly: tier.isManualOnly,
      },
      vips: {
        dedicatedManager: tier.hasDedicatedManager,
      },
    };
  }
}
