import { ApiProperty } from '@nestjs/swagger';
import { UserTierStatus } from '@prisma/client';
import { EffectiveBenefitsDto } from '../../public/dto/user-tier-public.response.dto';

export class UserTierAdminResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    tierId: string;

    @ApiProperty()
    tierName: string;

    @ApiProperty()
    totalEffectiveRollingUsd: string;

    @ApiProperty()
    currentPeriodRollingUsd: string;

    @ApiProperty()
    currentPeriodDepositUsd: string;

    @ApiProperty()
    lastEvaluationAt: Date;

    @ApiProperty()
    highestPromotedPriority: number;

    @ApiProperty({ nullable: true })
    lastBonusReceivedAt: Date | null;

    @ApiProperty({ enum: UserTierStatus })
    status: UserTierStatus;

    @ApiProperty({ nullable: true })
    graceEndsAt: Date | null;

    @ApiProperty()
    lastTierChangedAt: Date;

    @ApiProperty({ nullable: true })
    customCompRate: string | null;

    @ApiProperty({ nullable: true })
    customLossbackRate: string | null;

    @ApiProperty({ nullable: true })
    customRakebackRate: string | null;

    @ApiProperty({ nullable: true })
    customReloadBonusRate: string | null;

    @ApiProperty({ nullable: true })
    customWithdrawalLimitUsd: string | null;

    @ApiProperty({ nullable: true })
    isCustomWithdrawalUnlimited: boolean | null;

    @ApiProperty({ nullable: true })
    isCustomDedicatedManager: boolean | null;

    @ApiProperty({ nullable: true })
    isCustomVipEventEligible: boolean | null;

    @ApiProperty()
    isBonusEligible: boolean;

    @ApiProperty({ nullable: true })
    nextEvaluationAt: Date | null;

    @ApiProperty({ nullable: true })
    note: string | null;

    @ApiProperty({ nullable: true })
    demotionWarningIssuedAt: Date | null;

    @ApiProperty({ nullable: true })
    demotionWarningTargetTierId: string | null;

    @ApiProperty({ nullable: true })
    demotionWarningTargetTierName: string | null;

    @ApiProperty()
    currentBenefits: EffectiveBenefitsDto;
}
