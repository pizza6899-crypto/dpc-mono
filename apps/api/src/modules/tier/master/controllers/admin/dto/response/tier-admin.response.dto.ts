import { ApiProperty } from '@nestjs/swagger';
import { Language, TierEvaluationCycle } from '@prisma/client';

export class TierTranslationResponseDto {
    @ApiProperty({ enum: Language })
    language: Language;

    @ApiProperty()
    name: string;

    @ApiProperty({ type: String, required: false, nullable: true })
    description: string | null;
}

export class TierAdminResponseDto {
    @ApiProperty()
    priority: number;

    @ApiProperty()
    code: string;

    @ApiProperty({ type: String })
    requirementUsd: string;

    @ApiProperty({ type: String })
    requirementDepositUsd: string;

    @ApiProperty({ type: String })
    maintenanceRollingUsd: string;

    @ApiProperty({ enum: TierEvaluationCycle })
    evaluationCycle: TierEvaluationCycle;

    @ApiProperty({ type: String })
    levelUpBonusUsd: string;

    @ApiProperty({ type: String })
    levelUpBonusWageringMultiplier: string;

    @ApiProperty()
    isImmediateBonusEnabled: boolean;

    @ApiProperty({ type: String })
    compRate: string;

    @ApiProperty({ type: String })
    lossbackRate: string;

    @ApiProperty({ type: String })
    rakebackRate: string;

    @ApiProperty({ type: String })
    reloadBonusRate: string;

    @ApiProperty({ type: String })
    dailyWithdrawalLimitUsd: string;

    @ApiProperty()
    isWithdrawalUnlimited: boolean;

    @ApiProperty()
    hasDedicatedManager: boolean;

    @ApiProperty()
    isVIPEventEligible: boolean;

    @ApiProperty({ required: false, nullable: true })
    imageUrl: string | null;

    @ApiProperty({ type: [TierTranslationResponseDto] })
    translations: TierTranslationResponseDto[];

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: String, nullable: true })
    updatedBy: string | null;
}
